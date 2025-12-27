// Cozy Download Manager Browser Extension
// Intercepts downloads and sends them to CDM via native messaging

const NATIVE_HOST = 'com.cozy.downloadmanager';

// Log that service worker is starting
console.log('[CDM Extension] Service worker starting...');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('[CDM Extension] Extension installed/updated');
  
  // Create context menu (with error handling)
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'download-with-cdm',
      title: 'Download with Cozy Download Manager',
      contexts: ['link', 'image', 'video', 'audio']
    }, () => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || String(chrome.runtime.lastError);
        // Only log if it's not a "duplicate" error (menu already exists)
        if (errorMsg && 
            !errorMsg.includes('duplicate') && 
            !errorMsg.includes('already exists') &&
            !errorMsg.includes('Cannot create item')) {
          console.error('[CDM Extension] Error creating context menu:', errorMsg);
        }
        // Silently ignore duplicate/expected errors
      } else {
        console.log('[CDM Extension] Context menu created');
      }
    });
  }
  
  // Set default settings
  chrome.storage.sync.get(['autoIntercept', 'showNotifications'], (result) => {
    if (result.autoIntercept === undefined) {
      chrome.storage.sync.set({ autoIntercept: true });
    }
    if (result.showNotifications === undefined) {
      chrome.storage.sync.set({ showNotifications: true });
    }
  });
});

// Also create context menu on startup (in case onInstalled didn't fire)
// This is a fallback - the menu might already exist from onInstalled
if (chrome.contextMenus) {
  chrome.contextMenus.create({
    id: 'download-with-cdm',
    title: 'Download with Cozy Download Manager',
    contexts: ['link', 'image', 'video', 'audio']
  }, () => {
    // Silently ignore "duplicate" or "already exists" errors
    if (chrome.runtime.lastError) {
      const errorMsg = chrome.runtime.lastError.message || String(chrome.runtime.lastError) || '';
      if (errorMsg && 
          !errorMsg.includes('duplicate') && 
          !errorMsg.includes('already exists') &&
          !errorMsg.includes('Cannot create item')) {
        console.warn('[CDM Extension] Context menu creation warning:', errorMsg);
      }
      // Silently ignore expected errors
    } else {
      console.log('[CDM Extension] Context menu ready');
    }
  });
}

// Listen for download events
console.log('[CDM Extension] Registering download listener...');
chrome.downloads.onCreated.addListener((downloadItem) => {
  console.log('[CDM Extension] ===== DOWNLOAD DETECTED =====');
  console.log('[CDM Extension] Download item:', downloadItem);
  console.log('[CDM Extension] URL:', downloadItem.url);
  console.log('[CDM Extension] Filename:', downloadItem.filename || downloadItem.suggestedFilename);
  
  // Check if auto-intercept is enabled
  chrome.storage.sync.get(['autoIntercept'], (result) => {
    if (result.autoIntercept === false) {
      console.log('[CDM Extension] Auto-intercept disabled, allowing browser download');
      return;
    }
    
    // Get download info
    const downloadInfo = {
      url: downloadItem.url,
      filename: downloadItem.filename || downloadItem.suggestedFilename || 'download',
      referrer: downloadItem.referrer || '',
      mime: downloadItem.mime || '',
      totalBytes: downloadItem.totalBytes || 0
    };
    
    // Send to CDM via native messaging
    sendToCDM(downloadInfo, (success) => {
      if (success) {
        // Cancel the browser download only if successfully sent to CDM
        chrome.downloads.cancel(downloadItem.id, () => {
          console.log('[CDM Extension] Browser download cancelled');
        });
      } else {
        console.log('[CDM Extension] Failed to send to CDM, allowing browser download');
      }
    });
  });
});

// Function to send download info to CDM
function sendToCDM(downloadInfo, callback) {
  console.log('[CDM Extension] ===== SENDING TO CDM =====');
  console.log('[CDM Extension] Download info:', downloadInfo);
  console.log('[CDM Extension] Attempting to connect to native host:', NATIVE_HOST);
  
  // Try to connect to native host
  try {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    console.log('[CDM Extension] Native messaging port created');
    
    let responded = false;
    
    // Handle response
    port.onMessage.addListener((response) => {
      if (responded) return;
      responded = true;
      
      console.log('[CDM Extension] Response from CDM:', response);
      if (response.success) {
        chrome.storage.sync.get(['showNotifications'], (result) => {
          if (result.showNotifications !== false) {
            showNotification('Download sent to Cozy Download Manager', downloadInfo.filename);
          }
        });
        if (callback) callback(true);
      } else {
        chrome.storage.sync.get(['showNotifications'], (result) => {
          if (result.showNotifications !== false) {
            showNotification('Failed to send to CDM', response.error || 'Unknown error');
          }
        });
        if (callback) callback(false);
      }
    });
    
    // Handle disconnect
    port.onDisconnect.addListener(() => {
      if (responded) return;
      responded = true;
      
      if (chrome.runtime.lastError) {
        console.error('[CDM Extension] Native messaging error:', chrome.runtime.lastError.message);
        chrome.storage.sync.get(['showNotifications'], (result) => {
          if (result.showNotifications !== false) {
            showNotification('CDM is not running', 'Please start Cozy Download Manager first');
          }
        });
      }
      if (callback) callback(false);
    });
    
    // Send download info
    port.postMessage({
      type: 'download',
      data: downloadInfo
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!responded) {
        responded = true;
        console.error('[CDM Extension] Connection timeout');
        if (callback) callback(false);
      }
    }, 5000);
    
  } catch (error) {
    console.error('[CDM Extension] Error connecting to CDM:', error);
    chrome.storage.sync.get(['showNotifications'], (result) => {
      if (result.showNotifications !== false) {
        showNotification('CDM connection failed', error.message);
      }
    });
    if (callback) callback(false);
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  }).catch((error) => {
    console.error('[CDM Extension] Error showing notification:', error);
  });
}

// Context menu handler (only if contextMenus API is available)
try {
  if (typeof chrome !== 'undefined' && chrome.contextMenus && typeof chrome.contextMenus.onClicked !== 'undefined') {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info && info.menuItemId === 'download-with-cdm') {
        const downloadInfo = {
          url: info.linkUrl || info.srcUrl || info.pageUrl || '',
          filename: info.linkText || 'download',
          referrer: (tab && tab.url) || '',
          mime: '',
          totalBytes: 0
        };
        sendToCDM(downloadInfo);
      }
    });
    console.log('[CDM Extension] Context menu handler registered');
  } else {
    console.warn('[CDM Extension] contextMenus.onClicked not available');
  }
} catch (error) {
  console.error('[CDM Extension] Error setting up context menu handler:', error);
}


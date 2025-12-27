// Popup script for CDM extension

const NATIVE_HOST = 'com.cozy.downloadmanager';

// Load settings
chrome.storage.sync.get(['autoIntercept', 'showNotifications'], (result) => {
  document.getElementById('autoIntercept').checked = result.autoIntercept !== false;
  document.getElementById('showNotifications').checked = result.showNotifications !== false;
});

// Save settings
document.getElementById('autoIntercept').addEventListener('change', (e) => {
  chrome.storage.sync.set({ autoIntercept: e.target.checked });
});

document.getElementById('showNotifications').addEventListener('change', (e) => {
  chrome.storage.sync.set({ showNotifications: e.target.checked });
});

// Test connection
document.getElementById('testConnection').addEventListener('click', () => {
  testConnection();
});

// Open CDM
document.getElementById('openCDM').addEventListener('click', () => {
  updateStatus(false, 'Launching CDM...');
  // Try to send a message to open CDM
  try {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    let responded = false;
    
    port.onMessage.addListener((response) => {
      if (responded) return;
      responded = true;
      updateStatus(response.success, response.message || (response.success ? 'CDM launched' : 'Failed to launch'));
      port.disconnect();
    });
    
    port.onDisconnect.addListener(() => {
      if (!responded) {
        if (chrome.runtime.lastError) {
          updateStatus(false, 'Error: ' + chrome.runtime.lastError.message);
        } else {
          updateStatus(false, 'CDM launch initiated');
        }
      }
    });
    
    // Send open message
    port.postMessage({ type: 'open' });
    
    // Timeout
    setTimeout(() => {
      if (!responded) {
        responded = true;
        port.disconnect();
        updateStatus(false, 'Launch timeout');
      }
    }, 3000);
    
  } catch (error) {
    updateStatus(false, 'Connection failed: ' + error.message);
  }
});

// Check connection status on load
checkConnection();

function checkConnection() {
  try {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    let responded = false;
    
    port.postMessage({ type: 'ping' });
    
    port.onMessage.addListener((response) => {
      if (responded) return;
      responded = true;
      // Ping success means native host is working, but CDM might not be running
      // The native host always responds to ping, so this just means connection works
      updateStatus(true, 'Extension connected (CDM may need to be started)');
      port.disconnect();
    });
    
    port.onDisconnect.addListener(() => {
      if (!responded) {
        if (chrome.runtime.lastError) {
          updateStatus(false, 'Error: ' + chrome.runtime.lastError.message);
        } else {
          updateStatus(false, 'Connection closed');
        }
      }
    });
    
    // Timeout after 3 seconds
    setTimeout(() => {
      if (!responded) {
        responded = true;
        try {
          port.disconnect();
        } catch (e) {}
        updateStatus(false, 'Connection timeout - check native host');
      }
    }, 3000);
    
  } catch (error) {
    updateStatus(false, 'Connection failed: ' + error.message);
  }
}

function testConnection() {
  updateStatus(false, 'Testing...');
  checkConnection();
}

function updateStatus(connected, message) {
  const indicator = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');
  
  if (connected) {
    indicator.classList.add('connected');
  } else {
    indicator.classList.remove('connected');
  }
  
  text.textContent = message;
}


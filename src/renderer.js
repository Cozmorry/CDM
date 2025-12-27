// Download management
let downloads = {
  queue: [],
  active: [],
  completed: []
};
let currentTab = 'active';
let settings = {};

// Icon helper - using react-icons style (Feather Icons)
// Note: In a browser context, we'll use the pre-defined SVG strings
// These match the react-icons/fi (Feather Icons) style
const icons = {
  settings: `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  plus: `<svg class="icon icon-inline" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  pause: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  play: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  cancel: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  open: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  folder: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  priority: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  up: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
  down: `<svg class="icon icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`
};

// DOM Elements
const addDownloadBtn = document.getElementById('addDownloadBtn');
const settingsBtn = document.getElementById('settingsBtn');
const downloadList = document.getElementById('downloadList');
const addDownloadModal = document.getElementById('addDownloadModal');
const settingsModal = document.getElementById('settingsModal');
const duplicateModal = document.getElementById('duplicateModal');
const closeModal = document.getElementById('closeModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const closeDuplicateModal = document.getElementById('closeDuplicateModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const skipDuplicateBtn = document.getElementById('skipDuplicateBtn');
const replaceDuplicateBtn = document.getElementById('replaceDuplicateBtn');
const startDownloadBtn = document.getElementById('startDownloadBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const downloadUrlInput = document.getElementById('downloadUrl');
const downloadFilenameInput = document.getElementById('downloadFilename');
const downloadPrioritySelect = document.getElementById('downloadPriority');
const downloadPathInput = document.getElementById('downloadPathInput');
const getFileInfoBtn = document.getElementById('getFileInfoBtn');
const backToStep1Btn = document.getElementById('backToStep1Btn');
const browseDownloadPathBtn = document.getElementById('browseDownloadPathBtn');
const downloadStep1 = document.getElementById('downloadStep1');
const downloadStep2 = document.getElementById('downloadStep2');
const fileSizeDisplay = document.getElementById('fileSizeDisplay');
const fileTypeDisplay = document.getElementById('fileTypeDisplay');
const queuedCountEl = document.getElementById('queuedCount');
const activeCountEl = document.getElementById('activeCount');
const completedCountEl = document.getElementById('completedCount');
const totalSpeedEl = document.getElementById('totalSpeed');
const statusTextEl = document.getElementById('statusText');
const statusBar = document.getElementById('statusBar');
const tabsContainer = document.getElementById('tabsContainer');
const tabButtons = document.querySelectorAll('.tab-btn');
const dragDropZone = document.getElementById('dragDropZone');
const emptyStateEl = document.getElementById('emptyState');

// Helper function to switch tabs
function switchTab(tabName) {
  tabButtons.forEach(b => {
    if (b.dataset.tab === tabName) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  currentTab = tabName;
  renderDownloads();
}

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// Modal state
let currentFileInfo = null;

// Helper function to validate URL
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper function to extract URL from clipboard text
function extractURLFromText(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (isValidURL(trimmed)) {
    return trimmed;
  }
  // Try to find URL in text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = trimmed.match(urlRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return null;
}

// Get URL from clipboard
async function getClipboardURL() {
  try {
    const clipboardText = await window.electronAPI.readClipboard();
    return extractURLFromText(clipboardText);
  } catch (error) {
    console.error('Error reading clipboard:', error);
    return null;
  }
}

// Event Listeners
addDownloadBtn.addEventListener('click', async () => {
  await openModalWithURL();
});

settingsBtn.addEventListener('click', () => {
  loadSettingsIntoUI();
  settingsModal.classList.add('active');
});

closeModal.addEventListener('click', closeModalHandler);
closeSettingsModal.addEventListener('click', closeSettingsModalHandler);
cancelBtn.addEventListener('click', closeModalHandler);
cancelSettingsBtn.addEventListener('click', closeSettingsModalHandler);

// Step navigation
backToStep1Btn.addEventListener('click', () => {
  downloadStep1.style.display = 'block';
  downloadStep2.style.display = 'none';
  getFileInfoBtn.style.display = 'inline-block';
  startDownloadBtn.style.display = 'none';
  backToStep1Btn.style.display = 'none';
});

// Get file info and go to step 2
getFileInfoBtn.addEventListener('click', async () => {
  const url = downloadUrlInput.value.trim();
  
  if (!url) {
    alert('Please enter a valid URL');
    return;
  }
  
  try {
    getFileInfoBtn.disabled = true;
    getFileInfoBtn.textContent = 'Loading...';
    fileSizeDisplay.textContent = 'Loading...';
    fileTypeDisplay.textContent = 'Loading...';
    
    // Get file info
    let fileInfo;
    try {
      fileInfo = await window.electronAPI.getFileInfo(url);
      console.log('[INFO] File info received:', fileInfo);
    } catch (error) {
      console.error('[ERROR] Error getting file info:', error);
      // Create a fallback fileInfo object
      fileInfo = {
        totalBytes: 0,
        contentType: 'unknown',
        filename: null,
        finalUrl: url
      };
    }
    
    currentFileInfo = fileInfo;
    
    // Display file info
    const sizeInMB = fileInfo.totalBytes > 0 ? (fileInfo.totalBytes / (1024 * 1024)).toFixed(2) : '0.00';
    const sizeText = fileInfo.totalBytes > 0 ? `${sizeInMB} MB (${fileInfo.totalBytes.toLocaleString()} bytes)` : 'Unknown (will be determined during download)';
    fileSizeDisplay.textContent = sizeText;
    fileTypeDisplay.textContent = fileInfo.contentType || 'Unknown';
    
    // Warn if it's a stub installer (small file, likely an installer)
    if (fileInfo.totalBytes > 0 && fileInfo.totalBytes < 2 * 1024 * 1024 && 
        (fileInfo.contentType?.includes('application') || fileInfo.filename?.toLowerCase().includes('stub'))) {
      const warningEl = document.createElement('div');
      warningEl.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 4px; color: #ffc107; font-size: 0.85rem;';
      warningEl.textContent = 'Warning: This appears to be a stub installer (small downloader). It will download the full application when run.';
      fileInfoDisplay.appendChild(warningEl);
    }
    
    // Auto-fill filename from file info or URL
    if (!downloadFilenameInput.value) {
      if (fileInfo.filename) {
        // Use filename from Content-Disposition header or URL
        downloadFilenameInput.value = fileInfo.filename;
        console.log('[INFO] Using filename from fileInfo:', fileInfo.filename);
      } else {
        // Try to get from final URL (after redirects)
        try {
          const finalUrl = fileInfo.finalUrl || url;
          const urlObj = new URL(finalUrl);
          let suggestedName = urlObj.pathname.split('/').pop();
          
          // If no filename in path, try query params
          if (!suggestedName || suggestedName === '' || suggestedName === '/') {
            const product = urlObj.searchParams.get('product');
            if (product) {
              // Add .exe extension for installer products
              suggestedName = product.includes('.') ? product : `${product}.exe`;
            } else {
              // Try to infer from content type
              if (fileInfo.contentType?.includes('application/x-msdownload') || 
                  fileInfo.contentType?.includes('application/octet-stream')) {
                suggestedName = 'installer.exe';
              } else {
                suggestedName = 'download';
              }
            }
          }
          
          downloadFilenameInput.value = suggestedName || 'download';
          console.log('[INFO] Using suggested filename from URL:', suggestedName);
        } catch (e) {
          downloadFilenameInput.value = 'download';
          console.log('[WARN] Using default filename: download');
        }
      }
    }
    
    // Show step 2
    downloadStep1.style.display = 'none';
    downloadStep2.style.display = 'block';
    getFileInfoBtn.style.display = 'none';
    startDownloadBtn.style.display = 'inline-block';
    backToStep1Btn.style.display = 'inline-block';
    
  } catch (error) {
    console.error('Error getting file info:', error);
    alert('Could not get file info. You can still proceed with the download.');
    
    // Show step 2 anyway with unknown info
    fileSizeDisplay.textContent = 'Unknown';
    fileTypeDisplay.textContent = 'Unknown';
    
    // Auto-fill filename
    if (!downloadFilenameInput.value) {
      try {
        const urlObj = new URL(url);
        const suggestedName = urlObj.pathname.split('/').pop() || 'download';
        downloadFilenameInput.value = suggestedName;
      } catch (e) {
        downloadFilenameInput.value = 'download';
      }
    }
    
    downloadStep1.style.display = 'none';
    downloadStep2.style.display = 'block';
    getFileInfoBtn.style.display = 'none';
    startDownloadBtn.style.display = 'inline-block';
    backToStep1Btn.style.display = 'inline-block';
  } finally {
    getFileInfoBtn.disabled = false;
    getFileInfoBtn.textContent = 'Next →';
  }
});

// Browse for download path
browseDownloadPathBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.selectFolder();
  if (result.success) {
    downloadPathInput.value = result.path;
    // Save the selected path to settings
    await window.electronAPI.setDownloadPath(result.path);
  }
});

// Step 2: Start download
startDownloadBtn.addEventListener('click', async () => {
  console.log('[INFO] Start Download button clicked');
  
  const url = downloadUrlInput.value.trim();
  const filename = downloadFilenameInput.value.trim();
  const priority = downloadPrioritySelect.value;
  const downloadPath = downloadPathInput.value.trim();
  
  if (!url || !filename) {
    alert('Please provide URL and filename');
    return;
  }
  
  // Check for duplicate downloads
  const duplicateCheck = await window.electronAPI.checkDuplicate(url, filename);
  
  if (duplicateCheck.isDuplicate) {
    // Show duplicate modal
    document.getElementById('duplicateUrl').textContent = duplicateCheck.existingDownload.url;
    document.getElementById('duplicateFilename').textContent = duplicateCheck.existingDownload.filename;
    document.getElementById('duplicateStatus').textContent = duplicateCheck.existingDownload.status;
    
    // Store the pending download info for later use
    window.pendingDownload = { url, filename, priority, downloadPath };
    window.duplicateDownloadId = duplicateCheck.existingDownload.id;
    
    duplicateModal.classList.add('active');
    return;
  }
  
  // No duplicate, proceed with download
  await proceedWithDownload(url, filename, priority, downloadPath);
});

// Helper function to proceed with download
async function proceedWithDownload(url, filename, priority, downloadPath, replaceDownloadId = null) {
  console.log('[INFO] Proceeding with download:', { url, filename, priority, downloadPath, replaceDownloadId });
  
  try {
    // Save the download path to settings if it was manually entered or changed
    if (downloadPath) {
      await window.electronAPI.setDownloadPath(downloadPath);
    }
    
    let result;
    if (replaceDownloadId) {
      // Replace existing download
      result = await window.electronAPI.replaceDownload(replaceDownloadId, url, { filename, priority, downloadPath });
    } else {
      // Add new download - check for duplicate again as safeguard
      const duplicateCheck = await window.electronAPI.checkDuplicate(url, filename);
      if (duplicateCheck.isDuplicate) {
        // Show duplicate modal
        document.getElementById('duplicateUrl').textContent = duplicateCheck.existingDownload.url;
        document.getElementById('duplicateFilename').textContent = duplicateCheck.existingDownload.filename;
        document.getElementById('duplicateStatus').textContent = duplicateCheck.existingDownload.status;
        
        window.pendingDownload = { url, filename, priority, downloadPath };
        window.duplicateDownloadId = duplicateCheck.existingDownload.id;
        
        duplicateModal.classList.add('active');
        return; // Don't proceed with download
      }
      
      // Add new download
      result = await window.electronAPI.downloadAdd(url, { filename, priority, downloadPath });
      
      // Check if backend also detected a duplicate
      if (!result.success && result.isDuplicate) {
        // Show duplicate modal
        document.getElementById('duplicateUrl').textContent = result.existingDownload.url;
        document.getElementById('duplicateFilename').textContent = result.existingDownload.filename;
        document.getElementById('duplicateStatus').textContent = result.existingDownload.status;
        
        window.pendingDownload = { url, filename, priority, downloadPath };
        window.duplicateDownloadId = result.existingDownload.id;
        
        duplicateModal.classList.add('active');
        return; // Don't proceed with download
      }
    }
    
    console.log('[INFO] Got result from main process:', result);
    
    if (result.success) {
      closeModalHandler();
      await refreshDownloads();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('[ERROR] Error calling downloadAdd:', error);
    alert('Error adding download: ' + error.message);
  }
}

// Duplicate modal handlers
closeDuplicateModal.addEventListener('click', () => {
  duplicateModal.classList.remove('active');
  window.pendingDownload = null;
  window.duplicateDownloadId = null;
});

skipDuplicateBtn.addEventListener('click', () => {
  duplicateModal.classList.remove('active');
  window.pendingDownload = null;
  window.duplicateDownloadId = null;
  // Just close, don't add the download
});

replaceDuplicateBtn.addEventListener('click', async () => {
  if (window.pendingDownload && window.duplicateDownloadId) {
    duplicateModal.classList.remove('active');
    const { url, filename, priority, downloadPath } = window.pendingDownload;
    const replaceDownloadId = window.duplicateDownloadId;
    
    window.pendingDownload = null;
    window.duplicateDownloadId = null;
    
    await proceedWithDownload(url, filename, priority, downloadPath, replaceDownloadId);
  }
});

// Close duplicate modal when clicking outside
duplicateModal.addEventListener('click', (e) => {
  if (e.target === duplicateModal) {
    duplicateModal.classList.remove('active');
    window.pendingDownload = null;
    window.duplicateDownloadId = null;
  }
});

saveSettingsBtn.addEventListener('click', async () => {
  const newSettings = {
    downloadPath: document.getElementById('downloadPath').value,
    maxConcurrent: parseInt(document.getElementById('maxConcurrent').value),
    maxSegments: parseInt(document.getElementById('maxSegments').value),
    bandwidthLimit: parseFloat(document.getElementById('bandwidthLimit').value) * 1024, // Convert KB/s to bytes/s
    retryAttempts: parseInt(document.getElementById('retryAttempts').value),
    retryDelay: parseInt(document.getElementById('retryDelay').value)
  };
  
  const result = await window.electronAPI.settingsSave(newSettings);
  if (result.success) {
    settings = { ...settings, ...newSettings };
    closeSettingsModalHandler();
    alert('Settings saved successfully!');
  } else {
    alert('Error saving settings');
  }
});

document.getElementById('browsePathBtn').addEventListener('click', async () => {
  const result = await window.electronAPI.selectFolder();
  if (result.success) {
    document.getElementById('downloadPath').value = result.path;
  }
});

// Close modal when clicking outside
addDownloadModal.addEventListener('click', (e) => {
  if (e.target === addDownloadModal) {
    closeModalHandler();
  }
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeSettingsModalHandler();
  }
});

function closeModalHandler() {
  addDownloadModal.classList.remove('active');
  
  // Clear all download info to avoid congestion
  downloadUrlInput.value = '';
  downloadFilenameInput.value = '';
  fileSizeDisplay.textContent = '';
  fileTypeDisplay.textContent = '';
  currentFileInfo = null;
  
  // Clear file info display if it exists (remove any warnings or extra content)
  const fileInfoDisplay = document.getElementById('fileInfoDisplay');
  if (fileInfoDisplay) {
    // Clear file size and type displays
    fileSizeDisplay.textContent = '-';
    fileTypeDisplay.textContent = '-';
    // Remove any warning elements that might have been added
    const warnings = fileInfoDisplay.querySelectorAll('div[style*="background"]');
    warnings.forEach(warning => warning.remove());
  }
  
  // Reset to step 1
  downloadStep1.style.display = 'block';
  downloadStep2.style.display = 'none';
  getFileInfoBtn.style.display = 'inline-block';
  startDownloadBtn.style.display = 'none';
  backToStep1Btn.style.display = 'none';
  
  // Reset priority to default
  if (downloadPrioritySelect) {
    downloadPrioritySelect.value = 'normal';
  }
}

function closeSettingsModalHandler() {
  settingsModal.classList.remove('active');
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getPriorityLabel(priority) {
  if (typeof priority === 'number') {
    return priority === 1 ? 'High' : priority === 3 ? 'Low' : 'Normal';
  }
  return priority || 'Normal';
}

function createDownloadItem(download) {
  const item = document.createElement('div');
  item.className = 'download-item';
  item.id = `download-${download.id}`;

  const statusClass = `status-${download.status}`;
  const progress = Math.min(100, Math.max(0, download.progress || 0));
  
  const remainingBytes = download.totalBytes - download.receivedBytes;
  const remainingTime = download.speed > 0 ? remainingBytes / download.speed : 0;
  const priority = getPriorityLabel(download.priority);

  let queueInfo = '';
  if (download.queuePosition && download.queuePosition > 0) {
    queueInfo = `<span class="queue-position">Queue: #${download.queuePosition}</span>`;
  }

  item.innerHTML = `
    <div class="download-header">
      <div class="download-info">
        <div class="download-filename">${escapeHtml(download.filename)}</div>
        <div class="download-url">${escapeHtml(download.url)}</div>
        ${queueInfo}
      </div>
      <div class="download-status">
        <span class="status-badge ${statusClass}">${download.status}</span>
        ${download.priority ? `<span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>` : ''}
      </div>
    </div>
    ${download.status === 'downloading' || download.status === 'paused' ? `
    <div class="download-progress">
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progress}%"></div>
      </div>
      <div class="progress-info">
        <span>${formatBytes(download.receivedBytes)} / ${download.totalBytes > 0 ? formatBytes(download.totalBytes) : '?'}</span>
        <span>${download.speed > 0 ? formatSpeed(download.speed) : '--'} ${download.status === 'downloading' ? `• ETA: ${formatTime(remainingTime)}` : ''}</span>
      </div>
    </div>
    ` : ''}
    ${download.status === 'completed' ? `
    <div class="download-completed-info">
      <span>Completed: ${download.completedAt ? new Date(download.completedAt).toLocaleString() : 'Just now'}</span>
      <span>Size: ${formatBytes(download.totalBytes)}</span>
    </div>
    ` : ''}
    ${download.status === 'error' ? `
    <div class="download-error">
      <span>Error: ${escapeHtml(download.error || 'Unknown error')}</span>
    </div>
    ` : ''}
    <div class="download-actions">
      ${download.status === 'downloading' ? `
        <button class="btn-icon" onclick="pauseDownload('${download.id}')">${icons.pause} Pause</button>
      ` : download.status === 'paused' ? `
        <button class="btn-icon" onclick="resumeDownload('${download.id}')">${icons.play} Resume</button>
      ` : ''}
      ${download.status === 'pending' || download.queuePosition ? `
        <button class="btn-icon" onclick="changePriority('${download.id}')">${icons.priority} Priority</button>
        <button class="btn-icon" onclick="moveUp('${download.id}')">${icons.up} Up</button>
        <button class="btn-icon" onclick="moveDown('${download.id}')">${icons.down} Down</button>
      ` : ''}
      ${download.status === 'completed' ? `
        <button class="btn-icon" onclick="openDownload('${download.id}')">${icons.open} Open</button>
        <button class="btn-icon" onclick="openDownloadFolder('${download.id}')">${icons.folder} Show in Folder</button>
      ` : ''}
      ${download.status !== 'completed' ? `
        <button class="btn-icon" onclick="cancelDownload('${download.id}')">${icons.cancel} Cancel</button>
      ` : ''}
    </div>
  `;

  return item;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderDownloads() {
  // Remove only download items, not the drag-drop zone
  const existingItems = downloadList.querySelectorAll('.download-item, .empty-state');
  existingItems.forEach(item => item.remove());
  
  let itemsToShow = [];
  
  if (currentTab === 'active') {
    itemsToShow = [...downloads.active, ...downloads.queue];
  } else if (currentTab === 'completed') {
    itemsToShow = downloads.completed;
  } else if (currentTab === 'history') {
    // History will be loaded separately
    loadHistory();
    return;
  }
  
  // Show/hide tabs based on whether there are downloads
  const hasDownloads = downloads.active.length > 0 || downloads.queue.length > 0 || downloads.completed.length > 0;
  if (tabsContainer) {
    tabsContainer.style.display = hasDownloads ? 'flex' : 'none';
  }
  
  // Show drag-drop zone when no downloads on active tab
  if (itemsToShow.length === 0 && currentTab === 'active') {
    if (dragDropZone) dragDropZone.style.display = 'flex';
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    return;
  }
  
  // Hide drag-drop zone when there are downloads
  if (dragDropZone) dragDropZone.style.display = 'none';
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  
  if (itemsToShow.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    if (currentTab === 'active') {
      emptyState.innerHTML = '<p>No active downloads. Click "Add Download" to get started!</p>';
    } else {
      emptyState.innerHTML = '<p>No completed downloads yet.</p>';
    }
    downloadList.appendChild(emptyState);
    return;
  }
  
  itemsToShow.forEach(download => {
    downloadList.appendChild(createDownloadItem(download));
  });
}

async function loadHistory() {
  const history = await window.electronAPI.historyGet(50);
  // Remove only download items, not the drag-drop zone
  const existingItems = downloadList.querySelectorAll('.download-item, .empty-state');
  existingItems.forEach(item => item.remove());
  
  // Hide drag-drop zone when showing history
  if (dragDropZone) dragDropZone.style.display = 'none';
  
  if (history.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = '<p>No download history yet.</p>';
    downloadList.appendChild(emptyState);
    return;
  }
  
  history.reverse().forEach(download => {
    downloadList.appendChild(createDownloadItem(download));
  });
}

function updateDownloadItem(download) {
  // Update in our local state
  let found = false;
  
  // Update in active
  const activeIndex = downloads.active.findIndex(d => d.id === download.id);
  if (activeIndex !== -1) {
    downloads.active[activeIndex] = download;
    found = true;
  }
  
  // Update in queue
  const queueIndex = downloads.queue.findIndex(d => d.id === download.id);
  if (queueIndex !== -1) {
    downloads.queue[queueIndex] = download;
    found = true;
  }
  
  // Update in completed
  const completedIndex = downloads.completed.findIndex(d => d.id === download.id);
  if (completedIndex !== -1) {
    downloads.completed[completedIndex] = download;
    found = true;
  }
  
  // Move to completed if status changed
  if (download.status === 'completed') {
    if (activeIndex !== -1) {
      downloads.active.splice(activeIndex, 1);
    }
    if (queueIndex !== -1) {
      downloads.queue.splice(queueIndex, 1);
    }
    if (!downloads.completed.find(d => d.id === download.id)) {
      downloads.completed.push(download);
    }
  }
  
  // Move to active if resumed
  if (download.status === 'downloading' && queueIndex !== -1) {
    downloads.queue.splice(queueIndex, 1);
    if (!downloads.active.find(d => d.id === download.id)) {
      downloads.active.push(download);
    }
  }
  
  // Auto-switch to completed tab when all downloads finish
  if (download.status === 'completed' && 
      downloads.active.length === 0 && 
      downloads.queue.length === 0 && 
      downloads.completed.length > 0 &&
      currentTab === 'active') {
    switchTab('completed');
    return; // Exit early since switchTab calls renderDownloads
  }
  
  // Re-render if current tab shows this download
  if (found && (currentTab === 'active' || (currentTab === 'completed' && download.status === 'completed'))) {
    renderDownloads();
    updateStats();
  }
}

function removeDownloadItem(downloadId) {
  downloads.active = downloads.active.filter(d => d.id !== downloadId);
  downloads.queue = downloads.queue.filter(d => d.id !== downloadId);
  downloads.completed = downloads.completed.filter(d => d.id !== downloadId);
  
  const item = document.getElementById(`download-${downloadId}`);
  if (item) {
    item.remove();
  }
  
  if (downloads.active.length === 0 && downloads.queue.length === 0 && currentTab === 'active') {
    downloadList.innerHTML = '<div class="empty-state"><p>No active downloads. Click "Add Download" to get started!</p></div>';
  }
  
  updateStats();
}

function updateStats() {
  let totalSpeed = 0;
  
  downloads.active.forEach(download => {
    if (download.status === 'downloading' && download.speed) {
      totalSpeed += download.speed;
    }
  });
  
  // Show/hide status bar based on whether there are downloads
  const hasDownloads = downloads.active.length > 0 || downloads.queue.length > 0;
  if (statusBar) {
    statusBar.style.display = hasDownloads ? 'flex' : 'none';
  }
  
  if (queuedCountEl) queuedCountEl.textContent = downloads.queue.length;
  if (activeCountEl) activeCountEl.textContent = downloads.active.length;
  if (completedCountEl) completedCountEl.textContent = downloads.completed.length;
  if (totalSpeedEl) totalSpeedEl.textContent = formatSpeed(totalSpeed);
  
  // Update status text
  if (statusTextEl) {
    if (downloads.active.length > 0) {
      statusTextEl.textContent = `${downloads.active.length} active download${downloads.active.length > 1 ? 's' : ''}`;
    } else if (downloads.queue.length > 0) {
      statusTextEl.textContent = `${downloads.queue.length} in queue`;
    } else {
      statusTextEl.textContent = 'Ready';
    }
  }
}

async function refreshDownloads() {
  const all = await window.electronAPI.downloadGetAll();
  downloads = all;
  renderDownloads();
  updateStats();
}

function loadSettingsIntoUI() {
  document.getElementById('downloadPath').value = settings.downloadPath || '';
  document.getElementById('maxConcurrent').value = settings.maxConcurrent || 3;
  document.getElementById('maxSegments').value = settings.maxSegments || 16;
  document.getElementById('bandwidthLimit').value = settings.bandwidthLimit ? (settings.bandwidthLimit / 1024) : 0;
  document.getElementById('retryAttempts').value = settings.retryAttempts || 3;
  document.getElementById('retryDelay').value = settings.retryDelay || 1000;
}

// Global functions for button clicks
window.pauseDownload = async (id) => {
  await window.electronAPI.downloadPause(id);
  await refreshDownloads();
};

window.resumeDownload = async (id) => {
  await window.electronAPI.downloadResume(id);
  await refreshDownloads();
};

window.cancelDownload = async (id) => {
  if (confirm('Are you sure you want to cancel this download?')) {
    await window.electronAPI.downloadCancel(id);
    await refreshDownloads();
  }
};

window.openDownload = async (id) => {
  await window.electronAPI.downloadOpen(id);
};

window.openDownloadFolder = async (id) => {
  await window.electronAPI.downloadOpenFolder(id);
};

window.changePriority = async (id) => {
  const priorities = ['high', 'normal', 'low'];
  const current = downloads.queue.find(d => d.id === id) || downloads.active.find(d => d.id === id);
  const currentPriority = current ? (current.priority === 1 ? 'high' : current.priority === 3 ? 'low' : 'normal') : 'normal';
  const currentIndex = priorities.indexOf(currentPriority);
  const nextIndex = (currentIndex + 1) % priorities.length;
  const newPriority = priorities[nextIndex];
  
  await window.electronAPI.downloadChangePriority(id, newPriority);
  await refreshDownloads();
};

window.moveUp = async (id) => {
  await window.electronAPI.downloadMoveUp(id);
  await refreshDownloads();
};

window.moveDown = async (id) => {
  await window.electronAPI.downloadMoveDown(id);
  await refreshDownloads();
};

// IPC Event Listeners
window.electronAPI.onDownloadUpdate((download) => {
  updateDownloadItem(download);
});

window.electronAPI.onDownloadRemoved((downloadId) => {
  removeDownloadItem(downloadId);
});

window.electronAPI.onDownloadsLoaded((allDownloads) => {
  downloads = allDownloads;
  renderDownloads();
  updateStats();
});

window.electronAPI.onSettingsLoaded((loadedSettings) => {
  settings = loadedSettings;
});

// Load initial data
window.electronAPI.downloadGetAll().then((all) => {
  downloads = all;
  renderDownloads();
  updateStats();
  
  // Show drag-drop zone initially if no downloads
  if (dragDropZone && currentTab === 'active' && downloads.active.length === 0 && downloads.queue.length === 0) {
    dragDropZone.style.display = 'flex';
  }
});

window.electronAPI.settingsGet().then((loadedSettings) => {
  settings = loadedSettings;
});

// Initialize icons in buttons
function initializeIcons() {
  const settingsBtn = document.getElementById('settingsBtn');
  const addDownloadBtn = document.getElementById('addDownloadBtn');
  
  if (settingsBtn) {
    settingsBtn.innerHTML = icons.settings;
  }
  
  if (addDownloadBtn) {
    addDownloadBtn.innerHTML = icons.plus + ' Add Download';
  }
}

// Initialize icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeIcons);
} else {
  initializeIcons();
}

// Helper function to open modal with URL
async function openModalWithURL(url = null) {
  addDownloadModal.classList.add('active');
  downloadStep1.style.display = 'block';
  downloadStep2.style.display = 'none';
  getFileInfoBtn.style.display = 'inline-block';
  startDownloadBtn.style.display = 'none';
  backToStep1Btn.style.display = 'none';
  
  // Clear or set URL
  if (url) {
    downloadUrlInput.value = url;
  } else {
    downloadUrlInput.value = '';
    // Try to get URL from clipboard
    const clipboardURL = await getClipboardURL();
    if (clipboardURL) {
      downloadUrlInput.value = clipboardURL;
    }
  }
  
  downloadFilenameInput.value = '';
  fileSizeDisplay.textContent = '';
  fileTypeDisplay.textContent = '';
  
  const currentSettings = await window.electronAPI.settingsGet();
  downloadPathInput.value = currentSettings.downloadPath || '';
  downloadUrlInput.focus();
}

// Drag and Drop functionality
if (dragDropZone) {
  // Make drag-drop zone clickable
  dragDropZone.addEventListener('click', async () => {
    await openModalWithURL();
  });

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragDropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop zone when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dragDropZone.addEventListener(eventName, () => {
      dragDropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dragDropZone.addEventListener(eventName, () => {
      dragDropZone.classList.remove('drag-over');
    }, false);
  });

  // Handle dropped files/links
  dragDropZone.addEventListener('drop', async (e) => {
    const data = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text');
    
    if (data) {
      const url = extractURLFromText(data);
      if (url && isValidURL(url)) {
        await openModalWithURL(url);
      } else {
        // If dropped text is not a valid URL, still open modal and try clipboard
        await openModalWithURL();
      }
    } else {
      // No text data, try clipboard
      await openModalWithURL();
    }
  }, false);
}

// Keyboard shortcuts
document.addEventListener('keydown', async (e) => {
  // Ctrl+V or Cmd+V to paste URL
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    // Only handle if not in an input field
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      const clipboardURL = await getClipboardURL();
      if (clipboardURL) {
        await openModalWithURL(clipboardURL);
        e.preventDefault();
      }
    }
  }
});

// Auto-refresh stats every second
setInterval(updateStats, 1000);

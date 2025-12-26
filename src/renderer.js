// Download management
let downloads = {
  queue: [],
  active: [],
  completed: []
};
let currentTab = 'active';
let settings = {};

// DOM Elements
const addDownloadBtn = document.getElementById('addDownloadBtn');
const settingsBtn = document.getElementById('settingsBtn');
const downloadList = document.getElementById('downloadList');
const addDownloadModal = document.getElementById('addDownloadModal');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const startDownloadBtn = document.getElementById('startDownloadBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const downloadUrlInput = document.getElementById('downloadUrl');
const downloadFilenameInput = document.getElementById('downloadFilename');
const downloadPrioritySelect = document.getElementById('downloadPriority');
const queuedCountEl = document.getElementById('queuedCount');
const activeCountEl = document.getElementById('activeCount');
const completedCountEl = document.getElementById('completedCount');
const totalSpeedEl = document.getElementById('totalSpeed');
const tabButtons = document.querySelectorAll('.tab-btn');

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderDownloads();
  });
});

// Event Listeners
addDownloadBtn.addEventListener('click', () => {
  addDownloadModal.classList.add('active');
  downloadUrlInput.focus();
});

settingsBtn.addEventListener('click', () => {
  loadSettingsIntoUI();
  settingsModal.classList.add('active');
});

closeModal.addEventListener('click', closeModalHandler);
closeSettingsModal.addEventListener('click', closeSettingsModalHandler);
cancelBtn.addEventListener('click', closeModalHandler);
cancelSettingsBtn.addEventListener('click', closeSettingsModalHandler);

startDownloadBtn.addEventListener('click', async () => {
  console.log('🖱️ Start Download button clicked');
  
  const url = downloadUrlInput.value.trim();
  console.log('📝 URL:', url);
  
  if (!url) {
    alert('Please enter a valid URL');
    return;
  }

  const filename = downloadFilenameInput.value.trim() || undefined;
  const priority = downloadPrioritySelect.value;
  
  console.log('📤 Calling electronAPI.downloadAdd with:', { url, filename, priority });
  
  try {
    const result = await window.electronAPI.downloadAdd(url, { filename, priority });
    console.log('📥 Got result from main process:', result);
    
    if (result.success) {
      closeModalHandler();
      downloadUrlInput.value = '';
      downloadFilenameInput.value = '';
      downloadPrioritySelect.value = 'normal';
      await refreshDownloads();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error calling downloadAdd:', error);
    alert('Error adding download: ' + error.message);
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
        <button class="btn-icon" onclick="pauseDownload('${download.id}')">⏸ Pause</button>
      ` : download.status === 'paused' ? `
        <button class="btn-icon" onclick="resumeDownload('${download.id}')">▶ Resume</button>
      ` : ''}
      ${download.status === 'pending' || download.queuePosition ? `
        <button class="btn-icon" onclick="changePriority('${download.id}')">⚡ Priority</button>
        <button class="btn-icon" onclick="moveUp('${download.id}')">↑ Up</button>
        <button class="btn-icon" onclick="moveDown('${download.id}')">↓ Down</button>
      ` : ''}
      ${download.status === 'completed' ? `
        <button class="btn-icon" onclick="openDownload('${download.id}')">📂 Open</button>
        <button class="btn-icon" onclick="openDownloadFolder('${download.id}')">📁 Show in Folder</button>
      ` : ''}
      ${download.status !== 'completed' ? `
        <button class="btn-icon" onclick="cancelDownload('${download.id}')">❌ Cancel</button>
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
  downloadList.innerHTML = '';
  
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
  downloadList.innerHTML = '';
  
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
  if (download.status === 'completed' && activeIndex !== -1) {
    downloads.active.splice(activeIndex, 1);
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
  
  queuedCountEl.textContent = downloads.queue.length;
  activeCountEl.textContent = downloads.active.length;
  completedCountEl.textContent = downloads.completed.length;
  totalSpeedEl.textContent = formatSpeed(totalSpeed);
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
  document.getElementById('maxSegments').value = settings.maxSegments || 8;
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
});

window.electronAPI.settingsGet().then((loadedSettings) => {
  settings = loadedSettings;
});

// Auto-refresh stats every second
setInterval(updateStats, 1000);

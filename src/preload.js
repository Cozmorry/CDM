const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Download management
  downloadAdd: (url, options) => ipcRenderer.invoke('download:add', url, options),
  downloadPause: (id) => ipcRenderer.invoke('download:pause', id),
  downloadResume: (id) => ipcRenderer.invoke('download:resume', id),
  downloadCancel: (id) => ipcRenderer.invoke('download:cancel', id),
  downloadOpen: (id) => ipcRenderer.invoke('download:open', id),
  downloadOpenFolder: (id) => ipcRenderer.invoke('download:open-folder', id),
  downloadGetAll: () => ipcRenderer.invoke('download:get-all'),
  downloadChangePriority: (id, priority) => ipcRenderer.invoke('download:change-priority', id, priority),
  downloadMoveUp: (id) => ipcRenderer.invoke('download:move-up', id),
  downloadMoveDown: (id) => ipcRenderer.invoke('download:move-down', id),
  downloadGetStats: () => ipcRenderer.invoke('download:get-stats'),
  getFileInfo: (url) => ipcRenderer.invoke('download:get-file-info', url),
  
  // Download events
  onDownloadUpdate: (callback) => {
    ipcRenderer.on('download:update', (event, download) => callback(download));
  },
  onDownloadRemoved: (callback) => {
    ipcRenderer.on('download:removed', (event, downloadId) => callback(downloadId));
  },
  onDownloadsLoaded: (callback) => {
    ipcRenderer.on('downloads:loaded', (event, downloads) => callback(downloads));
  },
  
  // Settings
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSave: (settings) => ipcRenderer.invoke('settings:save', settings),
  onSettingsLoaded: (callback) => {
    ipcRenderer.on('settings:loaded', (event, settings) => callback(settings));
  },
  getDownloadPath: () => ipcRenderer.invoke('settings:get-download-path'),
  setDownloadPath: (path) => ipcRenderer.invoke('settings:set-download-path', path),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  
  // History
  historyGet: (limit) => ipcRenderer.invoke('history:get', limit),
  historyClear: () => ipcRenderer.invoke('history:clear'),
  
  // Duplicate detection
  checkDuplicate: (url, filename) => ipcRenderer.invoke('download:check-duplicate', url, filename),
  replaceDownload: (oldDownloadId, url, options) => ipcRenderer.invoke('download:replace', oldDownloadId, url, options),
  
  // Clipboard
  readClipboard: () => {
    return clipboard.readText();
  },
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

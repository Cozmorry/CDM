const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
// Use JavaScript download engine
const DownloadEngine = require('./download-engine');
console.log('✓ Using JavaScript download engine');

const DownloadQueue = require('./download-queue');
const DownloadPersistence = require('./download-persistence');

let mainWindow;
let downloadEngine;
let downloadQueue;
let persistence;
let downloads = new Map(); // Store all downloads (active, queued, completed)

// Data directory
const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'CDM-Data');

// Downloads directory
let downloadsDir = path.join(app.getPath('downloads'), 'CDM');

// Initialize
function initialize() {
  // Initialize persistence
  persistence = new DownloadPersistence(dataDir);
  
  // Load settings
  const settings = persistence.loadSettings();
  if (settings.downloadPath) {
    downloadsDir = settings.downloadPath;
  }
  
  // Ensure downloads directory exists
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  
  // Initialize download engine
  downloadEngine = new DownloadEngine({
    maxSegments: settings.maxSegments,
    minSegmentSize: settings.minSegmentSize,
    retryAttempts: settings.retryAttempts,
    retryDelay: settings.retryDelay,
    bandwidthLimit: settings.bandwidthLimit
  });
  
  // Initialize download queue
  downloadQueue = new DownloadQueue({
    maxConcurrent: settings.maxConcurrent || 3
  });
  
  // Helper function to serialize download info for IPC
  function serializeDownloadInfo(downloadInfo) {
    return {
      id: downloadInfo.id,
      url: downloadInfo.url,
      filename: downloadInfo.filename,
      filePath: downloadInfo.filePath,
      status: downloadInfo.status,
      progress: downloadInfo.progress,
      totalBytes: downloadInfo.totalBytes,
      receivedBytes: downloadInfo.receivedBytes,
      speed: downloadInfo.speed,
      startTime: downloadInfo.startTime,
      endTime: downloadInfo.endTime,
      error: downloadInfo.error,
      priority: downloadInfo.priority,
      queuePosition: downloadInfo.queuePosition,
      contentType: downloadInfo.contentType
    };
  }

  // Setup engine event handlers
  downloadEngine.on('progress', (downloadInfo) => {
    downloads.set(downloadInfo.id, downloadInfo);
    if (mainWindow) {
      mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
    }
    // Auto-save every 5 seconds
    if (Date.now() % 5000 < 100) {
      persistence.saveDownloads(downloads);
    }
  });
  
  downloadEngine.on('completed', ({ downloadId }) => {
    const downloadInfo = downloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.status = 'completed';
      downloadInfo.progress = 100;
      downloadInfo.completedAt = Date.now();
      downloads.set(downloadId, downloadInfo);
      downloadQueue.moveToCompleted(downloadId);
      
      // Add to history (serialize first to avoid circular refs)
      try {
        persistence.addHistoryEntry(serializeDownloadInfo(downloadInfo));
      } catch (err) {
        console.error('Error adding to history:', err.message);
      }
      
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      
      // Save state
      persistence.saveDownloads(downloads);
    }
  });
  
  downloadEngine.on('completed', ({ downloadId }) => {
    const downloadInfo = downloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.status = 'completed';
      downloadInfo.endTime = Date.now();
      downloadInfo.progress = 100;
      downloads.set(downloadId, downloadInfo);
      
      // Add to history (serialize first to avoid circular refs)
      try {
        persistence.addHistoryEntry(serializeDownloadInfo(downloadInfo));
      } catch (err) {
        console.error('Error adding to history:', err.message);
      }
      
      // Notify UI
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      
      // Move to completed in queue
      downloadQueue.moveToCompleted(downloadId);
      
      // Save state
      persistence.saveDownloads(downloads);
    }
  });
  
  downloadEngine.on('error', ({ downloadId, error }) => {
    const downloadInfo = downloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.status = 'error';
      downloadInfo.error = error;
      downloads.set(downloadId, downloadInfo);
      
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      
      persistence.saveDownloads(downloads);
    }
  });
  
  downloadEngine.on('paused', ({ downloadId }) => {
    const downloadInfo = downloads.get(downloadId);
    if (downloadInfo) {
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      persistence.saveDownloads(downloads);
    }
  });
  
  downloadEngine.on('resumed', ({ downloadId }) => {
    const downloadInfo = downloads.get(downloadId);
    if (downloadInfo) {
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
    }
  });
  
  // Setup queue event handlers
  downloadQueue.on('start', async (downloadInfo) => {
    console.log('🎯 START EVENT RECEIVED! Download ID:', downloadInfo.id);
    const isDev = process.argv.includes('--dev');
    console.log('🚀 Starting download:', downloadInfo.filename, 'from', downloadInfo.url);
    
    try {
      // Update status immediately
      downloadInfo.status = 'downloading';
      downloadInfo.startTime = Date.now();
      downloads.set(downloadInfo.id, downloadInfo);
      
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      
      // Get file info if not already available
      if (!downloadInfo.totalBytes || downloadInfo.totalBytes === 0) {
        try {
          if (isDev) console.log('📡 Getting file info for:', downloadInfo.url);
          const fileInfo = await downloadEngine.getFileInfo(downloadInfo.url);
          downloadInfo.totalBytes = fileInfo.totalBytes;
          downloadInfo.contentType = fileInfo.contentType;
          downloads.set(downloadInfo.id, downloadInfo);
          if (isDev) console.log('✓ File info:', fileInfo.totalBytes, 'bytes');
        } catch (infoError) {
          console.warn('⚠ Could not get file info:', infoError.message);
          // Continue anyway - download engine will handle it
        }
      }
      
      // Start download
      if (isDev) console.log('⬇️ Starting download engine...');
      await downloadEngine.startDownload(downloadInfo);
      
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
      
      if (isDev) console.log('✓ Download started successfully');
    } catch (error) {
      console.error('❌ Download start error:', error);
      if (isDev) {
        console.error('Error details:', error.stack);
      }
      downloadInfo.status = 'error';
      downloadInfo.error = error.message;
      downloads.set(downloadInfo.id, downloadInfo);
      downloadQueue.moveToCompleted(downloadInfo.id);
      
      if (mainWindow) {
        mainWindow.webContents.send('download:update', serializeDownloadInfo(downloadInfo));
      }
    }
  });
  
  downloadQueue.on('completed', (downloadInfo) => {
    persistence.saveDownloads(downloads);
  });
  
  // Load saved downloads on startup
  loadSavedDownloads();
}

function loadSavedDownloads() {
  const savedDownloads = persistence.loadDownloads();
  savedDownloads.forEach(downloadData => {
    // Only restore incomplete downloads
    if (downloadData.status !== 'completed' && downloadData.status !== 'error') {
      downloads.set(downloadData.id, downloadData);
      
      // Add to queue based on status
      if (downloadData.status === 'paused') {
        downloadQueue.add(downloadData, downloadData.priority === 1 ? 'high' : 
                         downloadData.priority === 3 ? 'low' : 'normal');
        downloadQueue.pause(downloadData.id);
      } else {
        downloadQueue.add(downloadData, downloadData.priority === 1 ? 'high' : 
                         downloadData.priority === 3 ? 'low' : 'normal');
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    // icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile('src/index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // Send initial data to renderer
  mainWindow.webContents.once('did-finish-load', () => {
    const allDownloads = {
      queue: downloadQueue.getAll().queue,
      active: downloadQueue.getAll().active,
      completed: downloadQueue.getAll().completed
    };
    mainWindow.webContents.send('downloads:loaded', allDownloads);
    
    const settings = persistence.loadSettings();
    mainWindow.webContents.send('settings:loaded', settings);
  });
}

app.whenReady().then(() => {
  initialize();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Save state before quitting
  persistence.saveDownloads(downloads);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  persistence.saveDownloads(downloads);
});

  // IPC Handlers
  ipcMain.handle('download:get-file-info', async (event, url) => {
    try {
      console.log('📡 Getting file info for:', url);
      const fileInfo = await downloadEngine.getFileInfo(url);
      return fileInfo;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  });

  ipcMain.handle('download:add', async (event, url, options = {}) => {
    console.log('\n========================================');
    console.log('📨 IPC HANDLER: download:add called');
    console.log('   URL:', url);
    console.log('   Options:', JSON.stringify(options));
    console.log('========================================\n');
    try {
    const downloadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const urlObj = new URL(url);
    
    // Get filename
    let filename = options.filename;
    if (!filename) {
      // Try to get filename from URL
      filename = path.basename(urlObj.pathname);
      
      // If no filename in path, try query params
      if (!filename || filename === '' || filename === '/') {
        const product = urlObj.searchParams.get('product');
        if (product) {
          filename = product;
        } else {
          filename = 'download';
        }
      }
    }
    
    // Get download directory - use custom path if provided
    const downloadsDir = options.downloadPath || settings.downloadPath;
    
    // Ensure unique filename
    let filePath = path.join(downloadsDir, filename);
    let counter = 1;
    while (fs.existsSync(filePath)) {
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      filePath = path.join(downloadsDir, `${name} (${counter})${ext}`);
      counter++;
    }
    
    const downloadInfo = {
      id: downloadId,
      url: url,
      filename: path.basename(filePath),
      filePath: filePath,
      status: 'pending',
      progress: 0,
      totalBytes: 0,
      receivedBytes: 0,
      speed: 0,
      startTime: null,
      paused: false,
      priority: options.priority || 'normal',
      addedAt: Date.now()
    };

    downloads.set(downloadId, downloadInfo);
    
    console.log('📥 IPC: Adding download to queue. ID:', downloadId, 'URL:', url);
    
    // Add to queue
    downloadQueue.add(downloadInfo, options.priority || 'normal');
    
    console.log('✅ IPC: Download added. Queue state:', {
      queue: downloadQueue.getAll().queue.length,
      active: downloadQueue.getAll().active.length
    });
    
    // Save state
    persistence.saveDownloads(downloads);
    
    return { success: true, downloadId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download:pause', async (event, downloadId) => {
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo) {
    downloadEngine.pauseDownload(downloadId);
    downloadQueue.pause(downloadId);
    downloadInfo.status = 'paused';
    downloads.set(downloadId, downloadInfo);
    persistence.saveDownloads(downloads);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('download:resume', async (event, downloadId) => {
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo && downloadInfo.status === 'paused') {
    downloadEngine.resumeDownload(downloadId);
    downloadQueue.resume(downloadId);
    downloadInfo.status = 'downloading';
    downloads.set(downloadId, downloadInfo);
    persistence.saveDownloads(downloads);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('download:cancel', async (event, downloadId) => {
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo) {
    downloadEngine.cancelDownload(downloadId);
    downloadQueue.remove(downloadId);
    downloads.delete(downloadId);
    
    if (mainWindow) {
      mainWindow.webContents.send('download:removed', downloadId);
    }
    
    persistence.saveDownloads(downloads);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('download:open', async (event, downloadId) => {
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo && downloadInfo.status === 'completed') {
    shell.openPath(downloadInfo.filePath);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('download:open-folder', async (event, downloadId) => {
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo) {
    shell.showItemInFolder(downloadInfo.filePath);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('download:get-all', async () => {
  const all = downloadQueue.getAll();
  return {
    queue: all.queue,
    active: all.active,
    completed: all.completed
  };
});

ipcMain.handle('download:change-priority', async (event, downloadId, priority) => {
  downloadQueue.changePriority(downloadId, priority);
  const downloadInfo = downloads.get(downloadId);
  if (downloadInfo) {
    downloadInfo.priority = priority;
    downloads.set(downloadId, downloadInfo);
    persistence.saveDownloads(downloads);
  }
  return { success: true };
});

ipcMain.handle('download:move-up', async (event, downloadId) => {
  downloadQueue.moveUp(downloadId);
  return { success: true };
});

ipcMain.handle('download:move-down', async (event, downloadId) => {
  downloadQueue.moveDown(downloadId);
  return { success: true };
});

ipcMain.handle('download:get-stats', async () => {
  return downloadQueue.getStats();
});

// Settings handlers
ipcMain.handle('settings:get', async () => {
  return persistence.loadSettings();
});

ipcMain.handle('settings:save', async (event, settings) => {
  const currentSettings = persistence.loadSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  // Apply settings to engine and queue
  if (settings.maxConcurrent !== undefined) {
    downloadQueue.setMaxConcurrent(settings.maxConcurrent);
  }
  
  if (settings.bandwidthLimit !== undefined) {
    downloadEngine.setBandwidthLimit(settings.bandwidthLimit);
  }
  
  if (settings.downloadPath !== undefined && settings.downloadPath) {
    downloadsDir = settings.downloadPath;
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  }
  
  persistence.saveSettings(newSettings);
  return { success: true };
});

ipcMain.handle('settings:get-download-path', async () => {
  return downloadsDir;
});

ipcMain.handle('settings:set-download-path', async (event, newPath) => {
  if (fs.existsSync(newPath)) {
    downloadsDir = newPath;
    const settings = persistence.loadSettings();
    settings.downloadPath = newPath;
    persistence.saveSettings(settings);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('history:get', async (event, limit) => {
  return persistence.getHistory(limit);
});

ipcMain.handle('history:clear', async () => {
  return { success: persistence.clearHistory() };
});

ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false };
});

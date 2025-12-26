const fs = require('fs');
const path = require('path');

class DownloadPersistence {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.downloadsFile = path.join(dataDir, 'downloads.json');
    this.settingsFile = path.join(dataDir, 'settings.json');
    this.historyFile = path.join(dataDir, 'history.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Save downloads state
   */
  saveDownloads(downloads) {
    try {
      const data = {
        timestamp: Date.now(),
        downloads: Array.from(downloads.values()).map(download => ({
          id: download.id,
          url: download.url,
          filename: download.filename,
          filePath: download.filePath,
          totalBytes: download.totalBytes,
          receivedBytes: download.receivedBytes,
          status: download.status,
          progress: download.progress,
          addedAt: download.addedAt,
          priority: download.priority,
          segments: download.segments ? download.segments.map(s => ({
            index: s.index,
            start: s.start,
            end: s.end,
            received: s.received
          })) : null
        }))
      };
      
      fs.writeFileSync(this.downloadsFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving downloads:', error);
      return false;
    }
  }

  /**
   * Load downloads state
   */
  loadDownloads() {
    try {
      if (!fs.existsSync(this.downloadsFile)) {
        return [];
      }
      
      const data = JSON.parse(fs.readFileSync(this.downloadsFile, 'utf8'));
      return data.downloads || [];
    } catch (error) {
      console.error('Error loading downloads:', error);
      return [];
    }
  }

  /**
   * Save settings
   */
  saveSettings(settings) {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Load settings
   */
  loadSettings() {
    try {
      if (!fs.existsSync(this.settingsFile)) {
        return this.getDefaultSettings();
      }
      
      const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
      return { ...this.getDefaultSettings(), ...settings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      downloadPath: null, // null = use default
      maxConcurrent: 3,
      maxSegments: 16, // Increased for faster downloads (like FDM)
      minSegmentSize: 512 * 1024, // 512KB minimum per segment (reduced for better utilization)
      bandwidthLimit: 0, // 0 = unlimited
      autoStart: true,
      removeCompletedAfter: 7, // days
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  /**
   * Add to history
   */
  addHistoryEntry(downloadInfo) {
    try {
      let history = [];
      if (fs.existsSync(this.historyFile)) {
        history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      }
      
      history.push({
        ...downloadInfo,
        completedAt: Date.now()
      });
      
      // Keep only last 1000 entries
      if (history.length > 1000) {
        history = history.slice(-1000);
      }
      
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
      return true;
    } catch (error) {
      console.error('Error adding to history:', error);
      return false;
    }
  }

  /**
   * Get history
   */
  getHistory(limit = 100) {
    try {
      if (!fs.existsSync(this.historyFile)) {
        return [];
      }
      
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      return history.slice(-limit);
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        fs.unlinkSync(this.historyFile);
      }
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }
}

module.exports = DownloadPersistence;


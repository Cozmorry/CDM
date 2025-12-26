const EventEmitter = require('events');

class DownloadQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 3; // Max concurrent downloads
    this.queue = [];
    this.active = new Map();
    this.completed = [];
    this.paused = new Set();
    this.priorities = {
      high: 1,
      normal: 2,
      low: 3
    };
  }

  /**
   * Add download to queue
   */
  add(downloadInfo, priority = 'normal') {
    downloadInfo.priority = this.priorities[priority] || this.priorities.normal;
    downloadInfo.queuePosition = this.queue.length + 1;
    downloadInfo.addedAt = Date.now();
    
    // Insert based on priority
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > downloadInfo.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, downloadInfo);
    this.updateQueuePositions();
    this.emit('added', downloadInfo);
    console.log('➕ Download added to queue. ID:', downloadInfo.id, 'Queue length:', this.queue.length);
    this.processQueue();
    
    return downloadInfo;
  }

  /**
   * Update queue positions
   */
  updateQueuePositions() {
    this.queue.forEach((item, index) => {
      item.queuePosition = index + 1;
    });
  }

  /**
   * Process queue - start downloads if slots available
   */
  processQueue() {
    console.log('🔄 Processing queue. Active:', this.active.size, 'Max:', this.maxConcurrent, 'Queued:', this.queue.length);
    
    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const downloadInfo = this.queue.shift();
      console.log('📋 Processing download from queue:', downloadInfo.id, downloadInfo.filename);
      
      if (downloadInfo && !downloadInfo.paused) {
        this.active.set(downloadInfo.id, downloadInfo);
        downloadInfo.queuePosition = 0;
        downloadInfo.status = 'downloading';
        console.log('✅ Emitting start event for:', downloadInfo.id);
        this.emit('start', downloadInfo);
      } else {
        console.log('⚠️ Skipping download (paused or invalid):', downloadInfo?.paused);
      }
    }
    
    if (this.queue.length > 0) {
      this.updateQueuePositions();
    }
  }

  /**
   * Move download to active
   */
  moveToActive(downloadId) {
    const downloadInfo = this.active.get(downloadId);
    if (downloadInfo) {
      this.active.set(downloadId, downloadInfo);
      this.emit('start', downloadInfo);
    }
  }

  /**
   * Move download to completed
   */
  moveToCompleted(downloadId) {
    const downloadInfo = this.active.get(downloadId);
    if (downloadInfo) {
      this.active.delete(downloadId);
      this.completed.push(downloadInfo);
      this.emit('completed', downloadInfo);
      this.processQueue(); // Start next download
    }
  }

  /**
   * Pause download
   */
  pause(downloadId) {
    if (this.active.has(downloadId)) {
      this.paused.add(downloadId);
      this.emit('pause', downloadId);
    }
  }

  /**
   * Resume download
   */
  resume(downloadId) {
    if (this.paused.has(downloadId)) {
      this.paused.delete(downloadId);
      this.emit('resume', downloadId);
    }
  }

  /**
   * Remove download from queue
   */
  remove(downloadId) {
    // Remove from queue
    const queueIndex = this.queue.findIndex(d => d.id === downloadId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.updateQueuePositions();
    }
    
    // Remove from active
    if (this.active.has(downloadId)) {
      this.active.delete(downloadId);
    }
    
    // Remove from paused
    this.paused.delete(downloadId);
    
    this.emit('removed', downloadId);
    this.processQueue();
  }

  /**
   * Change priority
   */
  changePriority(downloadId, priority) {
    const queueIndex = this.queue.findIndex(d => d.id === downloadId);
    if (queueIndex !== -1) {
      const downloadInfo = this.queue[queueIndex];
      downloadInfo.priority = this.priorities[priority] || this.priorities.normal;
      
      // Re-sort queue
      this.queue.splice(queueIndex, 1);
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].priority > downloadInfo.priority) {
          insertIndex = i;
          break;
        }
      }
      this.queue.splice(insertIndex, 0, downloadInfo);
      this.updateQueuePositions();
      this.emit('priority-changed', { downloadId, priority });
    }
  }

  /**
   * Move download up in queue
   */
  moveUp(downloadId) {
    const queueIndex = this.queue.findIndex(d => d.id === downloadId);
    if (queueIndex > 0) {
      [this.queue[queueIndex], this.queue[queueIndex - 1]] = 
        [this.queue[queueIndex - 1], this.queue[queueIndex]];
      this.updateQueuePositions();
      this.emit('moved', downloadId);
    }
  }

  /**
   * Move download down in queue
   */
  moveDown(downloadId) {
    const queueIndex = this.queue.findIndex(d => d.id === downloadId);
    if (queueIndex < this.queue.length - 1) {
      [this.queue[queueIndex], this.queue[queueIndex + 1]] = 
        [this.queue[queueIndex + 1], this.queue[queueIndex]];
      this.updateQueuePositions();
      this.emit('moved', downloadId);
    }
  }

  /**
   * Get all downloads
   */
  getAll() {
    return {
      queue: [...this.queue],
      active: Array.from(this.active.values()),
      completed: [...this.completed]
    };
  }

  /**
   * Get download by ID
   */
  get(downloadId) {
    return this.active.get(downloadId) || 
           this.queue.find(d => d.id === downloadId) ||
           this.completed.find(d => d.id === downloadId);
  }

  /**
   * Set max concurrent downloads
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = max;
    this.processQueue();
  }

  /**
   * Clear completed downloads
   */
  clearCompleted() {
    this.completed = [];
    this.emit('cleared-completed');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.active.size,
      paused: this.paused.size,
      completed: this.completed.length,
      total: this.queue.length + this.active.size + this.completed.length
    };
  }
}

module.exports = DownloadQueue;


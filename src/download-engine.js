const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const EventEmitter = require('events');

class DownloadEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxSegments = options.maxSegments || 8; // Max parallel segments
    this.minSegmentSize = options.minSegmentSize || 1024 * 1024; // 1MB minimum per segment
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    this.timeout = options.timeout || 30000; // 30 seconds
    this.bandwidthLimit = options.bandwidthLimit || 0; // 0 = unlimited
    this.activeDownloads = new Map();
  }

  /**
   * Start a multi-segment download
   */
  async startDownload(downloadInfo) {
    const downloadId = downloadInfo.id;
    console.log('🔧 DownloadEngine.startDownload called for:', downloadId);
    console.log('   URL:', downloadInfo.url);
    console.log('   FilePath:', downloadInfo.filePath);
    
    try {
      // Get file info if not already available
      if (!downloadInfo.totalBytes || downloadInfo.totalBytes === 0) {
        try {
          const fileInfo = await this.getFileInfo(downloadInfo.url);
          downloadInfo.totalBytes = fileInfo.totalBytes;
          downloadInfo.contentType = fileInfo.contentType;
        } catch (infoError) {
          console.warn('Could not get file info, proceeding anyway:', infoError.message);
          // Continue - we'll get size from response headers
        }
      }
      
      // For now, always use single-segment to avoid complexity
      // Multi-segment can be enabled later if needed
      return this.startSingleSegmentDownload(downloadInfo);
      
      // Check if server supports range requests and file is large enough
      // const supportsRanges = await this.checkRangeSupport(downloadInfo.url);
      // if (supportsRanges && downloadInfo.totalBytes > this.minSegmentSize) {
      //   // Multi-segment download
      //   return this.startMultiSegmentDownload(downloadInfo);
      // } else {
      //   // Single-segment download
      //   return this.startSingleSegmentDownload(downloadInfo);
      // }
    } catch (error) {
      console.error('Download start error:', error);
      this.emit('error', { downloadId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if server supports HTTP Range requests
   */
  async checkRangeSupport(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: this.timeout
      };

      const req = protocol.request(options, (res) => {
        const acceptsRanges = res.headers['accept-ranges'] === 'bytes';
        const contentLength = parseInt(res.headers['content-length'] || '0', 10);
        resolve(acceptsRanges && contentLength > 0);
        res.destroy();
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Get file size and metadata
   */
  async getFileInfo(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: this.timeout
      };

      const req = protocol.request(options, (res) => {
        const info = {
          totalBytes: parseInt(res.headers['content-length'] || '0', 10),
          contentType: res.headers['content-type'] || 'application/octet-stream',
          lastModified: res.headers['last-modified'] || null,
          acceptsRanges: res.headers['accept-ranges'] === 'bytes',
          statusCode: res.statusCode
        };
        res.destroy();
        resolve(info);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Multi-segment download - splits file into chunks
   */
  async startMultiSegmentDownload(downloadInfo) {
    const downloadId = downloadInfo.id;
    const urlObj = new URL(downloadInfo.url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    // Calculate optimal number of segments
    const optimalSegments = Math.min(
      this.maxSegments,
      Math.max(1, Math.floor(downloadInfo.totalBytes / this.minSegmentSize))
    );

    const segmentSize = Math.ceil(downloadInfo.totalBytes / optimalSegments);
    const segments = [];
    const fileStream = fs.createWriteStream(downloadInfo.filePath, { flags: 'w' });
    
    // Create segment file handles
    const segmentFiles = [];
    for (let i = 0; i < optimalSegments; i++) {
      const segmentFile = downloadInfo.filePath + `.seg${i}`;
      segmentFiles.push(segmentFile);
      
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize - 1, downloadInfo.totalBytes - 1);
      
      segments.push({
        index: i,
        start,
        end,
        received: 0,
        file: segmentFile,
        stream: null,
        request: null,
        retries: 0
      });
    }

    downloadInfo.segments = segments;
    downloadInfo.segmentFiles = segmentFiles;
    this.activeDownloads.set(downloadId, downloadInfo);

    // Download all segments in parallel
    const segmentPromises = segments.map(segment => 
      this.downloadSegment(downloadId, segment, urlObj, protocol)
    );

    // Wait for all segments to complete
    Promise.all(segmentPromises)
      .then(() => {
        // Merge segments into final file
        this.mergeSegments(downloadInfo)
          .then(() => {
            this.emit('completed', { downloadId });
            this.activeDownloads.delete(downloadId);
          })
          .catch(error => {
            this.emit('error', { downloadId, error: error.message });
          });
      })
      .catch(error => {
        this.emit('error', { downloadId, error: error.message });
      });

    return downloadInfo;
  }

  /**
   * Download a single segment
   */
  async downloadSegment(downloadId, segment, urlObj, protocol) {
    return new Promise((resolve, reject) => {
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (!downloadInfo || downloadInfo.paused) {
        return;
      }

      const fileStream = fs.createWriteStream(segment.file, { flags: 'w' });
      let lastUpdate = Date.now();
      let lastBytes = segment.received;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Range': `bytes=${segment.start + segment.received}-${segment.end}`
        },
        timeout: this.timeout
      };

      const req = protocol.request(options, (res) => {
        if (res.statusCode !== 206 && res.statusCode !== 200) {
          fileStream.close();
          fs.unlinkSync(segment.file);
          if (segment.retries < this.retryAttempts) {
            segment.retries++;
            setTimeout(() => {
              this.downloadSegment(downloadId, segment, urlObj, protocol)
                .then(resolve)
                .catch(reject);
            }, this.retryDelay * segment.retries);
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        res.on('data', (chunk) => {
          if (downloadInfo.paused) {
            res.pause();
            return;
          }

          // Bandwidth limiting
          if (this.bandwidthLimit > 0) {
            // Simple throttling - in production, use a proper token bucket
            const chunkSize = chunk.length;
            const delay = (chunkSize / this.bandwidthLimit) * 1000;
            if (delay > 10) {
              res.pause();
              setTimeout(() => res.resume(), delay);
            }
          }

          fileStream.write(chunk);
          segment.received += chunk.length;
          downloadInfo.receivedBytes += chunk.length;

          // Update progress
          const now = Date.now();
          if (now - lastUpdate >= 100) { // Update every 100ms
            const bytesDiff = segment.received - lastBytes;
            const timeDiff = (now - lastUpdate) / 1000;
            segment.speed = bytesDiff / timeDiff;
            
            // Calculate overall speed
            let totalSpeed = 0;
            downloadInfo.segments.forEach(s => {
              totalSpeed += s.speed || 0;
            });
            downloadInfo.speed = totalSpeed;

            // Calculate progress
            if (downloadInfo.totalBytes > 0) {
              downloadInfo.progress = (downloadInfo.receivedBytes / downloadInfo.totalBytes) * 100;
            }

            this.emit('progress', downloadInfo);
            lastUpdate = now;
            lastBytes = segment.received;
          }
        });

        res.on('end', () => {
          fileStream.end();
          resolve();
        });

        res.on('error', (error) => {
          fileStream.close();
          if (fs.existsSync(segment.file)) {
            fs.unlinkSync(segment.file);
          }
          
          if (segment.retries < this.retryAttempts) {
            segment.retries++;
            segment.received = 0; // Reset segment
            setTimeout(() => {
              this.downloadSegment(downloadId, segment, urlObj, protocol)
                .then(resolve)
                .catch(reject);
            }, this.retryDelay * segment.retries);
          } else {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        fileStream.close();
        if (fs.existsSync(segment.file)) {
          fs.unlinkSync(segment.file);
        }
        
        if (segment.retries < this.retryAttempts) {
          segment.retries++;
          segment.received = 0;
          setTimeout(() => {
            this.downloadSegment(downloadId, segment, urlObj, protocol)
              .then(resolve)
              .catch(reject);
          }, this.retryDelay * segment.retries);
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        fileStream.close();
        
        if (segment.retries < this.retryAttempts) {
          segment.retries++;
          segment.received = 0;
          setTimeout(() => {
            this.downloadSegment(downloadId, segment, urlObj, protocol)
              .then(resolve)
              .catch(reject);
          }, this.retryDelay * segment.retries);
        } else {
          reject(new Error('Request timeout'));
        }
      });

      segment.request = req;
      req.end();
    });
  }

  /**
   * Merge downloaded segments into final file
   */
  async mergeSegments(downloadInfo) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(downloadInfo.filePath, { flags: 'w' });
      let currentSegment = 0;

      const writeNextSegment = () => {
        if (currentSegment >= downloadInfo.segments.length) {
          writeStream.end();
          
          // Clean up segment files
          downloadInfo.segmentFiles.forEach(file => {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
            }
          });
          
          resolve();
          return;
        }

        const segment = downloadInfo.segments[currentSegment];
        const readStream = fs.createReadStream(segment.file);

        readStream.on('data', (chunk) => {
          writeStream.write(chunk);
        });

        readStream.on('end', () => {
          currentSegment++;
          writeNextSegment();
        });

        readStream.on('error', (error) => {
          writeStream.close();
          reject(error);
        });
      };

      writeNextSegment();
    });
  }

  /**
   * Single-segment download (fallback)
   */
  async startSingleSegmentDownload(downloadInfo) {
    const downloadId = downloadInfo.id;
    const urlObj = new URL(downloadInfo.url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    console.log('📁 Creating file stream:', downloadInfo.filePath);
    const fileStream = fs.createWriteStream(downloadInfo.filePath, { flags: 'w' });
    
    fileStream.on('error', (err) => {
      console.error('❌ File stream error:', err);
    });
    
    fileStream.on('open', () => {
      console.log('✅ File stream opened');
    });
    
    let lastUpdate = Date.now();
    let lastBytes = downloadInfo.receivedBytes;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'CDM/1.0',
        ...(downloadInfo.receivedBytes > 0 ? {
          'Range': `bytes=${downloadInfo.receivedBytes}-`
        } : {})
      },
      timeout: this.timeout
    };
    
    console.log('🔧 Request options:', JSON.stringify(options, null, 2));

    const req = protocol.request(options, (res) => {
      console.log('📥 HTTP Response received!');
      console.log('   Status:', res.statusCode);
      console.log('   Headers:', JSON.stringify(res.headers, null, 2));
      
      if (res.statusCode === 200 || res.statusCode === 206) {
        if (res.statusCode === 200) {
          downloadInfo.totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          console.log('File size:', downloadInfo.totalBytes, 'bytes');
        }

        let chunkCount = 0;
        res.on('data', (chunk) => {
          chunkCount++;
          if (chunkCount <= 5 || chunkCount % 100 === 0) {
            console.log(`📦 Chunk #${chunkCount}:`, chunk.length, 'bytes');
          }
          
          if (downloadInfo.paused) {
            res.pause();
            return;
          }

          if (this.bandwidthLimit > 0) {
            const delay = (chunk.length / this.bandwidthLimit) * 1000;
            if (delay > 10) {
              res.pause();
              setTimeout(() => res.resume(), delay);
            }
          }

          fileStream.write(chunk);
          downloadInfo.receivedBytes += chunk.length;

          const now = Date.now();
          if (now - lastUpdate >= 100) {
            const bytesDiff = downloadInfo.receivedBytes - lastBytes;
            const timeDiff = (now - lastUpdate) / 1000;
            downloadInfo.speed = bytesDiff / timeDiff;

            if (downloadInfo.totalBytes > 0) {
              downloadInfo.progress = (downloadInfo.receivedBytes / downloadInfo.totalBytes) * 100;
            }

            this.emit('progress', downloadInfo);
            lastUpdate = now;
            lastBytes = downloadInfo.receivedBytes;
          }
        });

        res.on('end', () => {
          console.log('✅ Response ended. Total chunks:', chunkCount);
          fileStream.end(() => {
            console.log('✅ File stream closed');
          });
          downloadInfo.status = 'completed';
          downloadInfo.progress = 100;
          this.emit('completed', { downloadId });
          this.activeDownloads.delete(downloadId);
        });

        res.on('error', (error) => {
          fileStream.close();
          downloadInfo.status = 'error';
          downloadInfo.error = error.message;
          this.emit('error', { downloadId, error: error.message });
        });
      } else {
        downloadInfo.status = 'error';
        downloadInfo.error = `HTTP ${res.statusCode}`;
        this.emit('error', { downloadId, error: `HTTP ${res.statusCode}` });
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      fileStream.close();
      downloadInfo.status = 'error';
      downloadInfo.error = error.message;
      this.emit('error', { downloadId, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      fileStream.close();
      downloadInfo.status = 'error';
      downloadInfo.error = 'Request timeout';
      this.emit('error', { downloadId, error: 'Request timeout' });
    });

    downloadInfo.request = req;
    this.activeDownloads.set(downloadId, downloadInfo);
    req.end();

    return downloadInfo;
  }

  /**
   * Pause a download
   */
  pauseDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.paused = true;
      
      // Pause all segments
      if (downloadInfo.segments) {
        downloadInfo.segments.forEach(segment => {
          if (segment.request) {
            segment.request.destroy();
          }
        });
      }
      
      if (downloadInfo.request) {
        downloadInfo.request.destroy();
      }
      
      downloadInfo.status = 'paused';
      this.emit('paused', { downloadId });
    }
  }

  /**
   * Resume a download
   */
  resumeDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (downloadInfo && downloadInfo.status === 'paused') {
      downloadInfo.paused = false;
      downloadInfo.status = 'downloading';
      
      if (downloadInfo.segments) {
        // Resume multi-segment download
        const urlObj = new URL(downloadInfo.url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        downloadInfo.segments.forEach(segment => {
          if (segment.received < (segment.end - segment.start + 1)) {
            this.downloadSegment(downloadId, segment, urlObj, protocol);
          }
        });
      } else {
        // Resume single-segment download
        this.startSingleSegmentDownload(downloadInfo);
      }
      
      this.emit('resumed', { downloadId });
    }
  }

  /**
   * Cancel a download
   */
  cancelDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (downloadInfo) {
      // Cancel all segments
      if (downloadInfo.segments) {
        downloadInfo.segments.forEach(segment => {
          if (segment.request) {
            segment.request.destroy();
          }
          if (fs.existsSync(segment.file)) {
            fs.unlinkSync(segment.file);
          }
        });
      }
      
      if (downloadInfo.request) {
        downloadInfo.request.destroy();
      }
      
      if (fs.existsSync(downloadInfo.filePath) && downloadInfo.status !== 'completed') {
        fs.unlinkSync(downloadInfo.filePath);
      }
      
      this.activeDownloads.delete(downloadId);
      this.emit('cancelled', { downloadId });
    }
  }

  /**
   * Set bandwidth limit (bytes per second)
   */
  setBandwidthLimit(limit) {
    this.bandwidthLimit = limit;
  }
}

module.exports = DownloadEngine;


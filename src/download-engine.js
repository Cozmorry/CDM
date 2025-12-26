const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
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
    console.log('[DownloadEngine] startDownload called for:', downloadId);
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
      
      // Check if server supports range requests and file is large enough for multi-segment
      // We check range support from the fileInfo we already have (which follows redirects)
      const supportsRanges = downloadInfo.acceptsRanges !== false && 
                              downloadInfo.totalBytes > this.minSegmentSize &&
                              downloadInfo.totalBytes > 0;
      
      if (supportsRanges) {
        // Multi-segment download for faster speeds
        console.log(`[DownloadEngine] Using multi-segment download (${Math.min(this.maxSegments, Math.max(1, Math.floor(downloadInfo.totalBytes / this.minSegmentSize)))} segments)`);
        return this.startMultiSegmentDownload(downloadInfo);
      } else {
        // Single-segment download (fallback)
        console.log('[DownloadEngine] Using single-segment download (range requests not supported or file too small)');
        return this.startSingleSegmentDownload(downloadInfo);
      }
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
   * Get file size and metadata (follows redirects)
   */
  async getFileInfo(url, maxRedirects = 10) {
    return new Promise((resolve, reject) => {
      if (maxRedirects <= 0) {
        reject(new Error('Too many redirects'));
        return;
      }

      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      console.log(`[getFileInfo] Attempt ${11 - maxRedirects} (${url})`);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET', // Use GET instead of HEAD - some servers don't follow redirects with HEAD
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Range': 'bytes=0-0' // Request only first byte to get headers without downloading full file
        },
        timeout: this.timeout,
        rejectUnauthorized: false
      };

      const req = protocol.request(options, (res) => {
        console.log(`[getFileInfo] Status ${res.statusCode} for ${url}`);
        console.log(`   Content-Length: ${res.headers['content-length'] || 'unknown'}`);
        console.log(`   Content-Type: ${res.headers['content-type'] || 'unknown'}`);
        console.log(`   Location: ${res.headers.location || 'none'}`);
        
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            console.log(`[getFileInfo] Following redirect ${res.statusCode} -> ${redirectUrl}`);
            res.destroy();
            
            // Build full redirect URL
            let fullRedirectUrl;
            if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
              fullRedirectUrl = redirectUrl;
            } else if (redirectUrl.startsWith('/')) {
              fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
            } else {
              const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
              fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${redirectUrl}`;
            }
            
            // Recursively follow redirect
            this.getFileInfo(fullRedirectUrl, maxRedirects - 1)
              .then(resolve)
              .catch(reject);
            return;
          }
        }
        
        // Handle 206 Partial Content (Range request)
        if (res.statusCode === 206) {
          // For Range requests, Content-Range header has the total size
          const contentRange = res.headers['content-range'];
          if (contentRange) {
            const totalMatch = contentRange.match(/\/(\d+)/);
            if (totalMatch) {
              res.headers['content-length'] = totalMatch[1];
              console.log(`[getFileInfo] Content-Range indicates total size: ${totalMatch[1]} bytes`);
            }
          }
        }

        // Parse Content-Disposition header for filename
        let filenameFromHeader = null;
        const contentDisposition = res.headers['content-disposition'];
        if (contentDisposition) {
          console.log('[getFileInfo] Content-Disposition header:', contentDisposition);
          
          // Try multiple patterns to extract filename
          // Pattern 1: filename="value" or filename=value
          let filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";\n]+)['"]?/i);
          if (!filenameMatch) {
            // Pattern 2: filename*=UTF-8''value (RFC 5987)
            filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^'";\n]+)/i);
          }
          if (!filenameMatch) {
            // Pattern 3: filename*=value
            filenameMatch = contentDisposition.match(/filename\*=([^'";\n]+)/i);
          }
          
          if (filenameMatch && filenameMatch[1]) {
            filenameFromHeader = filenameMatch[1].trim();
            // Decode URL-encoded filename
            try {
              filenameFromHeader = decodeURIComponent(filenameFromHeader);
            } catch (e) {
              // Try unescaping if decodeURIComponent fails
              try {
                filenameFromHeader = unescape(filenameFromHeader);
              } catch (e2) {
                // Keep original if both fail
              }
            }
            console.log('[getFileInfo] Extracted filename from Content-Disposition:', filenameFromHeader);
          }
        }

        // For GET requests, we need to drain the response body
        let dataReceived = false;
        res.on('data', (chunk) => {
          dataReceived = true;
          // We only requested 1 byte, so we can ignore it
        });
        
        res.on('end', () => {
          // If no filename from Content-Disposition, try to get from URL
          let finalFilename = filenameFromHeader;
          if (!finalFilename) {
            try {
              const finalUrlObj = new URL(url);
              const pathname = finalUrlObj.pathname;
              if (pathname && pathname !== '/' && pathname !== '') {
                let urlFilename = path.basename(pathname);
                if (urlFilename && urlFilename !== '/' && urlFilename !== '') {
                  // Decode URL-encoded characters (e.g., %20 -> space)
                  try {
                    urlFilename = decodeURIComponent(urlFilename);
                  } catch (e) {
                    // If decoding fails, try with the original
                    console.log('[getFileInfo] Could not decode URL filename, using as-is');
                  }
                  finalFilename = urlFilename;
                  console.log('[getFileInfo] Filename from URL path:', finalFilename);
                }
              }
            } catch (e) {
              // Ignore URL parsing errors
            }
          }
          
          // Also decode filename from header if it came from URL encoding
          if (finalFilename && finalFilename.includes('%')) {
            try {
              finalFilename = decodeURIComponent(finalFilename);
              console.log('[getFileInfo] Decoded URL-encoded filename:', finalFilename);
            } catch (e) {
              // Keep original if decoding fails
            }
          }
          
          // Check if server supports range requests
          // A 206 response to a Range request means it supports ranges
          const acceptsRanges = res.statusCode === 206 || res.headers['accept-ranges'] === 'bytes';
          
          const info = {
            totalBytes: parseInt(res.headers['content-length'] || '0', 10),
            contentType: res.headers['content-type'] || 'application/octet-stream',
            lastModified: res.headers['last-modified'] || null,
            acceptsRanges: acceptsRanges,
            statusCode: res.statusCode,
            filename: finalFilename,
            finalUrl: url // Track the final URL after redirects
          };
          
          console.log('[getFileInfo] File info result:', {
            filename: finalFilename,
            size: info.totalBytes,
            type: info.contentType,
            finalUrl: url
          });
          
          resolve(info);
        });
        
        res.on('error', (err) => {
          // Even if there's an error, try to resolve with what we have
          const acceptsRanges = res.statusCode === 206 || res.headers['accept-ranges'] === 'bytes';
          const info = {
            totalBytes: parseInt(res.headers['content-length'] || '0', 10),
            contentType: res.headers['content-type'] || 'application/octet-stream',
            lastModified: res.headers['last-modified'] || null,
            acceptsRanges: acceptsRanges,
            statusCode: res.statusCode,
            filename: filenameFromHeader,
            finalUrl: url
          };
          resolve(info);
        });
      });

      req.on('error', (err) => {
        console.error('[getFileInfo] Request error:', err.message);
        reject(err);
      });
      
      req.on('timeout', () => {
        console.error('[getFileInfo] Request timeout');
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity', // Don't use compression
          'Range': `bytes=${segment.start + segment.received}-${segment.end}`
        },
        timeout: this.timeout,
        rejectUnauthorized: false
      };

      const req = protocol.request(options, (res) => {
        // Handle redirects in segment downloads
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            fileStream.close();
            res.destroy();
            
            // Build full redirect URL
            let fullRedirectUrl;
            if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
              fullRedirectUrl = redirectUrl;
            } else if (redirectUrl.startsWith('/')) {
              fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
            } else {
              const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
              fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${redirectUrl}`;
            }
            
            // Update URL and retry
            const newUrlObj = new URL(fullRedirectUrl);
            urlObj.hostname = newUrlObj.hostname;
            urlObj.port = newUrlObj.port;
            urlObj.pathname = newUrlObj.pathname;
            urlObj.search = newUrlObj.search;
            urlObj.protocol = newUrlObj.protocol;
            
            // Retry with new URL
            setTimeout(() => {
              this.downloadSegment(downloadId, segment, urlObj, protocol)
                .then(resolve)
                .catch(reject);
            }, 100);
            return;
          }
        }
        
        if (res.statusCode !== 206 && res.statusCode !== 200) {
          fileStream.close();
          if (fs.existsSync(segment.file)) {
            fs.unlinkSync(segment.file);
          }
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
   * Single-segment download (fallback) - follows redirects recursively
   */
  async startSingleSegmentDownload(downloadInfo, maxRedirects = 10) {
    if (maxRedirects <= 0) {
      downloadInfo.status = 'error';
      downloadInfo.error = 'Too many redirects';
      this.emit('error', { downloadId: downloadInfo.id, error: 'Too many redirects' });
      return;
    }

    const downloadId = downloadInfo.id;
    const urlObj = new URL(downloadInfo.url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    console.log(`[Download] Attempt ${11 - maxRedirects} (${downloadInfo.url})`);
    
    // Delete old file if we're following a redirect (not the first attempt)
    if (maxRedirects < 10 && fs.existsSync(downloadInfo.filePath)) {
      try {
        fs.unlinkSync(downloadInfo.filePath);
        console.log('[Download] Deleted old file from previous redirect');
      } catch (e) {
        console.warn('Could not delete old file:', e.message);
      }
    }
    
    const fileStream = fs.createWriteStream(downloadInfo.filePath, { flags: 'w' });
    
    fileStream.on('error', (err) => {
      console.error('[Download] File stream error:', err);
    });
    
    fileStream.on('open', () => {
      console.log('[Download] File stream opened');
    });
    
    let lastUpdate = Date.now();
    let lastBytes = downloadInfo.receivedBytes;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity', // Don't use compression
        ...(downloadInfo.receivedBytes > 0 ? {
          'Range': `bytes=${downloadInfo.receivedBytes}-`
        } : {})
      },
      timeout: this.timeout,
      rejectUnauthorized: false
    };
    
    console.log(`[Download] Request to: ${urlObj.hostname}${urlObj.pathname}${urlObj.search}`);

    const req = protocol.request(options, (res) => {
      console.log(`[Download] HTTP ${res.statusCode} from ${urlObj.hostname}`);
      console.log(`   Content-Length: ${res.headers['content-length'] || 'unknown'}`);
      console.log(`   Location: ${res.headers.location || 'none'}`);
      
      // Handle redirects - follow ALL redirects in the chain
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          console.log(`[Download] Redirect ${res.statusCode} -> ${redirectUrl}`);
          fileStream.close();
          
          // Check for filename in Content-Disposition (some redirects include it)
          const contentDisposition = res.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              let headerFilename = filenameMatch[1].replace(/['"]/g, '').trim();
              try {
                headerFilename = decodeURIComponent(headerFilename);
              } catch (e) {
                // Keep original if decode fails
              }
              
              if (headerFilename) {
                const downloadsDir = path.dirname(downloadInfo.filePath);
                let newFilePath = path.join(downloadsDir, headerFilename);
                
                // Ensure unique filename
                const ext = path.extname(headerFilename);
                const name = path.basename(headerFilename, ext);
                let counter = 1;
                while (fs.existsSync(newFilePath)) {
                  newFilePath = path.join(downloadsDir, `${name} (${counter})${ext}`);
                  counter++;
                }
                
                downloadInfo.filename = path.basename(newFilePath);
                downloadInfo.filePath = newFilePath;
                console.log('[Download] Filename updated from redirect Content-Disposition:', downloadInfo.filename);
              }
            }
          }
          
          // Build full redirect URL
          let fullRedirectUrl;
          if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
            fullRedirectUrl = redirectUrl;
          } else if (redirectUrl.startsWith('/')) {
            fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
          } else {
            const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
            fullRedirectUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${redirectUrl}`;
          }
          
          console.log(`[Download] Following redirect to: ${fullRedirectUrl}`);
          
          // Reset progress for new redirect
          downloadInfo.url = fullRedirectUrl;
          downloadInfo.receivedBytes = 0;
          
          // Recursively follow redirect
          setTimeout(() => {
            this.startSingleSegmentDownload(downloadInfo, maxRedirects - 1)
              .catch(err => {
                console.error('Error following redirect:', err);
                downloadInfo.status = 'error';
                downloadInfo.error = err.message;
                this.emit('error', { downloadId: downloadInfo.id, error: err.message });
              });
          }, 100);
          return;
        }
      }
      
      if (res.statusCode === 200 || res.statusCode === 206) {
        if (res.statusCode === 200) {
          downloadInfo.totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          console.log('File size:', downloadInfo.totalBytes, 'bytes');
          
          // Update filename from Content-Disposition header if available
          // This happens on the final response (not a redirect)
          const contentDisposition = res.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              let headerFilename = filenameMatch[1].replace(/['"]/g, '').trim();
              try {
                headerFilename = decodeURIComponent(headerFilename);
              } catch (e) {
                // Keep original if decode fails
              }
              
              if (headerFilename && path.basename(downloadInfo.filePath) !== headerFilename) {
                console.log('[Download] Content-Disposition filename detected:', headerFilename);
                console.log('[Download] Note: Filename will be updated after download completes');
                // Store the correct filename - we'll rename the file after download completes
                downloadInfo.correctFilename = headerFilename;
              }
            }
          }
        }

        let chunkCount = 0;
        res.on('data', (chunk) => {
          chunkCount++;
          if (chunkCount <= 5 || chunkCount % 100 === 0) {
            // Chunk received (logging disabled for performance)
            // console.log(`[Download] Chunk #${chunkCount}:`, chunk.length, 'bytes');
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
          console.log('[Download] Response ended. Total chunks:', chunkCount);
          fileStream.end(() => {
            console.log('[Download] File stream closed');
            
            // Rename file if we have a correct filename from Content-Disposition
            if (downloadInfo.correctFilename && path.basename(downloadInfo.filePath) !== downloadInfo.correctFilename) {
              const downloadsDir = path.dirname(downloadInfo.filePath);
              let newFilePath = path.join(downloadsDir, downloadInfo.correctFilename);
              
              // Ensure unique filename
              const ext = path.extname(downloadInfo.correctFilename);
              const name = path.basename(downloadInfo.correctFilename, ext);
              let counter = 1;
              while (fs.existsSync(newFilePath)) {
                newFilePath = path.join(downloadsDir, `${name} (${counter})${ext}`);
                counter++;
              }
              
              try {
                fs.renameSync(downloadInfo.filePath, newFilePath);
                downloadInfo.filePath = newFilePath;
                downloadInfo.filename = path.basename(newFilePath);
                console.log('[Download] File renamed to:', downloadInfo.filename);
              } catch (err) {
                console.error('[Download] Could not rename file:', err.message);
              }
            }
            
            downloadInfo.status = 'completed';
            downloadInfo.progress = 100;
            this.emit('completed', { downloadId });
            this.activeDownloads.delete(downloadId);
          });
        });

        res.on('error', (error) => {
          fileStream.close();
          downloadInfo.status = 'error';
          downloadInfo.error = error.message;
          this.emit('error', { downloadId, error: error.message });
        });
      } else {
        console.error('[Download] Unexpected HTTP status:', res.statusCode);
        fileStream.close();
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


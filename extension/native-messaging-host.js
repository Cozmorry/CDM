// Native Messaging Host Launcher
// This script is launched by the browser to communicate with CDM

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the Electron app
const appPath = process.env.APPDATA || process.env.LOCALAPPDATA;
const cdmPath = path.join(appPath, 'Cozy Download Manager', 'Cozy Download Manager.exe');

// Alternative: if running from development
const devPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron.cmd');
const devAppPath = path.join(__dirname, '..');

let stdinBuffer = Buffer.alloc(0);

// Read from stdin (messages from browser extension)
// Native messaging uses binary format: 4-byte length (little-endian) + JSON message
process.stdin.on('data', (data) => {
  stdinBuffer = Buffer.concat([stdinBuffer, data]);
  
  // Process complete messages
  while (stdinBuffer.length >= 4) {
    // Read 32-bit little-endian length (first 4 bytes)
    const length = stdinBuffer.readUInt32LE(0);
    
    if (length === 0 || length > 1024 * 1024) { // Max 1MB message
      console.error('[Native Messaging] Invalid message length:', length);
      stdinBuffer = Buffer.alloc(0);
      break;
    }
    
    // Check if we have the complete message (4 bytes header + message)
    if (stdinBuffer.length < 4 + length) {
      break; // Wait for more data
    }
    
    // Extract the JSON message (skip first 4 bytes)
    const messageJson = stdinBuffer.slice(4, 4 + length).toString('utf8');
    stdinBuffer = stdinBuffer.slice(4 + length);
    
    try {
      const message = JSON.parse(messageJson);
      handleMessage(message);
    } catch (error) {
      console.error('[Native Messaging] Error parsing message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
});

// Handle messages from extension
function handleMessage(message) {
  console.error('[Native Messaging] Received message:', JSON.stringify(message));
  
  switch (message.type) {
    case 'download':
      handleDownload(message.data);
      break;
    case 'ping':
      // Respond immediately to ping
      sendResponse({ success: true, message: 'pong', cdmRunning: true });
      break;
    case 'open':
      // Try to open CDM and respond
      launchCDM();
      sendResponse({ success: true, message: 'CDM launch initiated' });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type: ' + (message.type || 'undefined') });
  }
}

// Handle download request - send to CDM via IPC
function handleDownload(downloadInfo) {
  console.error('[Native Messaging] Handling download:', JSON.stringify(downloadInfo));
  
  // Launch CDM if not running and send download
  launchCDMAndSendDownload(downloadInfo);
}

// Launch CDM (standalone function for 'open' command)
function launchCDM() {
  let cdmExecutable = null;
  
  // Check development mode first
  const projectRoot = path.join(__dirname, '..');
  const devElectron = path.join(projectRoot, 'node_modules', '.bin', 'electron.cmd');
  const devElectronAlt = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  
  if (fs.existsSync(devElectron)) {
    try {
      console.error('[Native Messaging] Launching CDM in development mode');
      const npm = spawn('npm', ['start'], {
        cwd: projectRoot,
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      npm.unref();
      return true;
    } catch (error) {
      console.error('[Native Messaging] Error launching dev CDM:', error);
    }
  } else if (fs.existsSync(devElectronAlt)) {
    try {
      console.error('[Native Messaging] Launching CDM in development mode (alt)');
      const electron = spawn(devElectronAlt, [projectRoot], {
        detached: true,
        stdio: 'ignore'
      });
      electron.unref();
      return true;
    } catch (error) {
      console.error('[Native Messaging] Error launching dev CDM (alt):', error);
    }
  }
  
  // Check installed locations
  const possiblePaths = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Cozy Download Manager', 'Cozy Download Manager.exe'),
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Cozy Download Manager', 'Cozy Download Manager.exe') : null,
    path.join(process.env.LOCALAPPDATA, 'Programs', 'cozy-download-manager', 'Cozy Download Manager.exe'),
    path.join(process.env.APPDATA, 'Cozy Download Manager', 'Cozy Download Manager.exe'),
    cdmPath
  ].filter(p => p !== null);
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      cdmExecutable = possiblePath;
      break;
    }
  }
  
  if (cdmExecutable) {
    try {
      console.error('[Native Messaging] Launching CDM:', cdmExecutable);
      // Launch without shell to avoid CMD window, and as detached process
      const cdm = spawn(cdmExecutable, [], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      cdm.unref();
      return true;
    } catch (error) {
      console.error('[Native Messaging] Error launching CDM:', error);
      return false;
    }
  }
  
  return false;
}

// Launch CDM and send download
function launchCDMAndSendDownload(downloadInfo) {
  // First, send the download (CDM will pick it up when it starts)
  sendDownloadToCDM(downloadInfo);
  
  // Try to launch CDM if not running
  let cdmExecutable = null;
  let launchArgs = [];
  
  // Check development mode first (most likely scenario)
  const projectRoot = path.join(__dirname, '..');
  const devElectron = path.join(projectRoot, 'node_modules', '.bin', 'electron.cmd');
  const devElectronAlt = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  
  if (fs.existsSync(devElectron)) {
    // Development mode - launch with npm start (use cmd.exe /c to hide window)
    try {
      console.error('[Native Messaging] Launching CDM in development mode');
      // Use cmd.exe /c with start /min to minimize window, or use PowerShell to hide it
      const { exec } = require('child_process');
      exec('npm start', {
        cwd: projectRoot,
        windowsHide: true,
        detached: true
      }, (error) => {
        if (error) {
          console.error('[Native Messaging] Error launching dev CDM:', error);
        }
      });
      return;
    } catch (error) {
      console.error('[Native Messaging] Error launching dev CDM:', error);
    }
  } else if (fs.existsSync(devElectronAlt)) {
    // Alternative dev path
    try {
      console.error('[Native Messaging] Launching CDM in development mode (alt)');
      const electron = spawn(devElectronAlt, [projectRoot], {
        detached: true,
        stdio: 'ignore'
      });
      electron.unref();
      return;
    } catch (error) {
      console.error('[Native Messaging] Error launching dev CDM (alt):', error);
    }
  }
  
  // Check installed locations (production builds)
  const possiblePaths = [
    // Primary installation path (Program Files)
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Cozy Download Manager', 'Cozy Download Manager.exe'),
    // Alternative Program Files (x86)
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Cozy Download Manager', 'Cozy Download Manager.exe') : null,
    // Default NSIS installation (LocalAppData)
    path.join(process.env.LOCALAPPDATA, 'Programs', 'cozy-download-manager', 'Cozy Download Manager.exe'),
    // User AppData
    path.join(process.env.APPDATA, 'Cozy Download Manager', 'Cozy Download Manager.exe'),
    // Original path variable
    cdmPath
  ].filter(p => p !== null); // Remove null entries
  
  console.error('[Native Messaging] Checking for CDM in the following paths:');
  for (const possiblePath of possiblePaths) {
    if (possiblePath) {
      const exists = fs.existsSync(possiblePath);
      console.error(`  ${exists ? 'FOUND' : 'NOT FOUND'} ${possiblePath}`);
      if (exists && !cdmExecutable) {
        cdmExecutable = possiblePath;
        console.error('[Native Messaging] Found CDM at:', possiblePath);
      }
    }
  }
  
  // Launch CDM if found (after sending response)
  if (cdmExecutable) {
    try {
      console.error('[Native Messaging] Launching CDM:', cdmExecutable);
      const cdm = spawn(cdmExecutable, [], {
        detached: true,
        stdio: 'ignore'
      });
      cdm.unref();
      console.error('[Native Messaging] CDM launch initiated');
    } catch (error) {
      console.error('[Native Messaging] Error launching CDM:', error);
      // Don't send error here - response already sent
    }
  } else {
    console.error('[Native Messaging] CDM executable not found in standard locations');
    console.error('[Native Messaging] Checked paths:', possiblePaths);
    console.error('[Native Messaging] Download info saved, CDM will pick it up when started manually');
    // Response already sent, so CDM can be started manually
  }
}

// Send download to CDM via file-based communication
function sendDownloadToCDM(downloadInfo) {
  try {
    // Create a temp file with download info in the watch directory
    const os = require('os');
    const tempDir = os.tmpdir();
    const watchDir = path.join(tempDir, 'cdm-downloads');
    
    // Create watch directory if it doesn't exist
    if (!fs.existsSync(watchDir)) {
      fs.mkdirSync(watchDir, { recursive: true });
    }
    
    // Ensure filename is extracted from URL if not provided
    if (!downloadInfo.filename || downloadInfo.filename === 'download') {
      try {
        const urlObj = new URL(downloadInfo.url);
        const urlPath = urlObj.pathname;
        const urlFilename = path.basename(urlPath);
        if (urlFilename && urlFilename !== '/' && urlFilename !== '') {
          downloadInfo.filename = urlFilename;
        } else {
          // Try to get from Content-Disposition or use a default
          downloadInfo.filename = 'download';
        }
      } catch (e) {
        downloadInfo.filename = 'download';
      }
    }
    
    const tempFile = path.join(watchDir, 'cdm-download-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.json');
    fs.writeFileSync(tempFile, JSON.stringify(downloadInfo, null, 2), 'utf8');
    
    console.error('[Native Messaging] Download info written to:', tempFile);
    console.error('[Native Messaging] Download data:', JSON.stringify(downloadInfo, null, 2));
    
    // Send success response immediately (before launching CDM)
    sendResponse({ 
      success: true, 
      message: 'Download sent to CDM',
      filename: downloadInfo.filename 
    });
  } catch (error) {
    console.error('[Native Messaging] Error sending download to CDM:', error);
    sendResponse({ 
      success: false, 
      error: error.message || String(error)
    });
  }
}

// Send response back to extension
function sendResponse(response) {
  try {
    const responseJson = JSON.stringify(response);
    const length = Buffer.byteLength(responseJson, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(length, 0);
    
    // Write length prefix (4 bytes) + message
    process.stdout.write(lengthBuffer);
    process.stdout.write(responseJson, 'utf8');
    // Don't end stdout - keep connection alive for potential follow-up messages
  } catch (error) {
    console.error('[Native Messaging] Error sending response:', error);
  }
}

// Handle errors
process.stdin.on('end', () => {
  // Don't exit - keep connection alive for potential follow-up messages
// process.exit(0);
});

process.on('SIGINT', () => {
  // Don't exit - keep connection alive for potential follow-up messages
// process.exit(0);
});

process.on('SIGTERM', () => {
  // Don't exit - keep connection alive for potential follow-up messages
// process.exit(0);
});


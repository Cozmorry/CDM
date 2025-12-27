// Native Messaging Host for Cozy Download Manager
// Handles communication from browser extension

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let stdinBuffer = '';

// Read from stdin (messages from browser extension)
process.stdin.on('data', (data) => {
  stdinBuffer += data.toString();
  
  // Process complete messages (JSON messages are length-prefixed)
  while (stdinBuffer.length > 0) {
    // Find the length prefix (first 4 bytes)
    if (stdinBuffer.length < 4) break;
    
    const length = parseInt(stdinBuffer.substring(0, 4), 10);
    if (isNaN(length) || length < 0) {
      console.error('[Native Messaging] Invalid message length');
      stdinBuffer = '';
      break;
    }
    
    // Check if we have the complete message
    if (stdinBuffer.length < 4 + length) break;
    
    // Extract and parse the message
    const messageJson = stdinBuffer.substring(4, 4 + length);
    stdinBuffer = stdinBuffer.substring(4 + length);
    
    try {
      const message = JSON.parse(messageJson);
      handleMessage(message);
    } catch (error) {
      console.error('[Native Messaging] Error parsing message:', error);
    }
  }
});

// Handle messages from extension
function handleMessage(message) {
  console.log('[Native Messaging] Received message:', message);
  
  switch (message.type) {
    case 'download':
      handleDownload(message.data);
      break;
    case 'ping':
      sendResponse({ success: true, message: 'pong' });
      break;
    case 'open':
      openCDM();
      sendResponse({ success: true, message: 'CDM opened' });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

// Handle download request
function handleDownload(downloadInfo) {
  console.log('[Native Messaging] Handling download:', downloadInfo);
  
  // Send IPC message to main window to add download
  // This will be handled by the main process
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send('native-messaging-download', downloadInfo);
    sendResponse({ 
      success: true, 
      message: 'Download added to CDM',
      filename: downloadInfo.filename 
    });
  } else {
    // CDM window is not open, try to open it
    openCDM();
    // Wait a bit and try again
    setTimeout(() => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('native-messaging-download', downloadInfo);
        sendResponse({ 
          success: true, 
          message: 'Download added to CDM',
          filename: downloadInfo.filename 
        });
      } else {
        sendResponse({ 
          success: false, 
          error: 'CDM window could not be opened' 
        });
      }
    }, 1000);
  }
}

// Open CDM window (if not already open)
function openCDM() {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.show();
    global.mainWindow.focus();
  } else {
    // CDM is not running, we can't open it from here
    // The extension should handle this case
    console.log('[Native Messaging] CDM is not running');
  }
}

// Send response back to extension
function sendResponse(response) {
  const responseJson = JSON.stringify(response);
  const length = Buffer.byteLength(responseJson, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(length, 0);
  
  process.stdout.write(lengthBuffer);
  process.stdout.write(responseJson, 'utf8');
}

// Handle errors
process.stdin.on('end', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Export for use in main.js
module.exports = { handleMessage, sendResponse };


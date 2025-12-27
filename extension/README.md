# Cozy Download Manager Browser Extension

A Chromium browser extension that automatically intercepts downloads and sends them to Cozy Download Manager (CDM).

## Features

- 🚀 **Automatic Download Interception**: Automatically captures browser downloads
- 📥 **Seamless Integration**: Sends downloads directly to CDM
- 🎯 **Smart Detection**: Detects download URLs, filenames, and metadata
- ⚙️ **Configurable**: Toggle automatic interception on/off
- 🔔 **Notifications**: Get notified when downloads are sent to CDM
- 🎨 **Modern UI**: Dark theme matching CDM's design

## Installation

### Step 1: Install the Extension

1. Open Chrome/Edge/Brave
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension` folder from this repository

### Step 2: Install Native Messaging Host

The native messaging host allows the extension to communicate with CDM.

**Option A: Automatic Installation (Recommended)**

1. Open PowerShell as Administrator
2. Navigate to the extension folder:
   ```powershell
   cd path\to\CDM\extension
   ```
3. Run the installation script:
   ```powershell
   .\install-native-messaging.ps1
   ```

**Option B: Manual Installation**

1. Edit `com.cozy.downloadmanager.json` and update the `path` to point to your `native-messaging-host.js` file
2. Update `allowed_origins` with your extension ID (get it from `chrome://extensions/`)
3. Create registry entry:
   ```powershell
   # For Chrome
   New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Force
   Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value "C:\full\path\to\com.cozy.downloadmanager.json"
   
   # For Edge
   New-Item -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Force
   Set-ItemProperty -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value "C:\full\path\to\com.cozy.downloadmanager.json"
   ```

### Step 3: Update Extension ID

1. After loading the extension, note its ID from `chrome://extensions/`
2. Edit `com.cozy.downloadmanager.json`
3. Replace `YOUR_EXTENSION_ID_HERE` with your actual extension ID:
   ```json
   "allowed_origins": [
     "chrome-extension://YOUR_ACTUAL_EXTENSION_ID/"
   ]
   ```
4. Re-run the installation script or update the registry manually

## Usage

1. **Automatic Mode** (Default): The extension automatically intercepts all downloads and sends them to CDM
2. **Manual Mode**: Right-click on links/images/videos and select "Download with Cozy Download Manager"
3. **Settings**: Click the extension icon to:
   - Toggle automatic interception
   - Test connection to CDM
   - Open CDM manually

## How It Works

1. Extension detects a download in the browser
2. Cancels the browser download
3. Sends download info to CDM via native messaging
4. CDM receives the download and adds it to the queue
5. CDM window opens/focuses automatically

## Troubleshooting

### Extension shows "CDM is not running"

- Make sure CDM is installed and running
- Check that the native messaging host is properly installed
- Verify the extension ID matches in the manifest

### Downloads not being intercepted

- Check that "Automatically intercept downloads" is enabled in extension popup
- Verify extension has necessary permissions
- Check browser console for errors (F12)

### Native messaging connection fails

- Ensure the manifest path in registry is correct
- Verify `native-messaging-host.js` exists at the specified path
- Check that Node.js is installed and accessible
- Try reinstalling the native messaging host

## Development

### Building Icons

Create extension icons from `assets/icon.png`:
- 16x16px → `icons/icon16.png`
- 32x32px → `icons/icon32.png`
- 48x48px → `icons/icon48.png`
- 128x128px → `icons/icon128.png`

### Testing

1. Load extension in developer mode
2. Test download interception
3. Check native messaging connection
4. Verify CDM receives downloads

## Files

- `manifest.json` - Extension manifest
- `background.js` - Service worker for download interception
- `popup.html/js/css` - Extension popup UI
- `native-messaging-host.js` - Bridge between extension and CDM
- `com.cozy.downloadmanager.json` - Native messaging manifest
- `install-native-messaging.ps1` - Installation script

## License

MIT License - Same as Cozy Download Manager


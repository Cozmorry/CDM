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
   - Downloads open in CDM's modal for user confirmation
   - You can review and edit the download info before starting
   
2. **Manual Mode**: Right-click on links/images/videos and select "Download with Cozy Download Manager"
   - Useful for downloading specific items without auto-interception
   
3. **Settings**: Click the extension icon to:
   - Toggle automatic interception on/off
   - Toggle notifications on/off
   - Test connection to CDM
   - Open CDM manually

## Download Flow

When a download is detected:

1. **Browser Download Starts** → Extension intercepts it
2. **Extension Sends to CDM** → Via native messaging
3. **CDM Opens Modal** → With URL and filename pre-filled
4. **User Reviews Info** → Can edit filename, path, priority
5. **User Confirms** → Clicks "Start Download"
6. **Download Begins** → In CDM with multi-segment support

This two-step process ensures you have control over all downloads.

## How It Works

1. Extension detects a download in the browser
2. Cancels the browser download (if auto-interception is enabled)
3. Sends download info to CDM via native messaging
4. CDM receives the download and opens the download modal
5. User reviews the download info (URL, filename, size)
6. User clicks "Start Download" to confirm
7. Download is added to CDM's queue and starts

**Note**: Downloads require user confirmation in CDM before starting. This prevents unwanted downloads and gives you control over what gets downloaded.

## Troubleshooting

### Extension shows "CDM is not running" or "Connection timeout"

- **CDM Not Running**: The extension can launch CDM automatically, but if it's not installed, you'll see this message
- **Native Messaging Host**: Make sure the native messaging host is properly installed:
  ```powershell
  cd extension
  .\install-native-messaging.ps1
  ```
- **Extension ID Mismatch**: Verify your extension ID in `com.cozy.downloadmanager.json` matches the one in `chrome://extensions/`
- **Node.js Not Found**: Ensure Node.js is installed and accessible at `C:\Program Files\nodejs\node.exe`

### Downloads not being intercepted

- Check that "Automatically intercept downloads" is enabled in extension popup
- Verify extension has necessary permissions (check `chrome://extensions/`)
- Check browser console for errors (F12 → Console tab)
- Make sure CDM is installed and the native messaging host is set up

### Native messaging connection fails

- **Manifest Path**: Ensure the manifest path in registry points to the correct location
- **Host Script**: Verify `native-messaging-host.js` exists at the specified path
- **Node.js**: Check that Node.js is installed and in PATH
- **Reinstall**: Try reinstalling the native messaging host:
  ```powershell
  .\install-native-messaging.ps1
  ```

### CMD window appears when downloading

- This is normal for the native messaging host launcher
- The window is hidden but may flash briefly
- CDM itself runs without a CMD window

### Download modal doesn't open in CDM

- Make sure CDM is installed and can be launched
- Check that the native messaging host can find CDM at:
  - `C:\Program Files\Cozy Download Manager\Cozy Download Manager.exe`
  - Or your custom installation path
- Verify the file watcher in CDM is working (check CDM console for errors)

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

### Extension Files (Included in Package)
- `manifest.json` - Extension manifest
- `background.js` - Service worker for download interception
- `popup.html/js/css` - Extension popup UI
- `icons/` - Extension icons (16x16, 32x32, 48x48, 128x128)

### Native Messaging Host Files (Installed Separately)
- `native-messaging-host.js` - Bridge between extension and CDM
- `native-messaging-host.bat` - Launcher script (hides CMD window)
- `native-messaging-host-launcher.ps1` - PowerShell launcher
- `com.cozy.downloadmanager.json` - Native messaging manifest
- `install-native-messaging.ps1` - Installation script

### Development Files
- `package-extension.ps1` - Script to package extension for Chrome Web Store
- `PUBLISHING.md` - Guide for publishing to Chrome Web Store
- `test-native-messaging.ps1` - Test script for native messaging setup
- `README.md` - This file

## Packaging for Chrome Web Store

To create a package for publishing:

```powershell
cd extension
.\package-extension.ps1
```

This creates `cozy-download-manager-extension-v1.0.0.zip` in the parent directory.

See [PUBLISHING.md](PUBLISHING.md) for complete publishing instructions.

## License

MIT License - Same as Cozy Download Manager


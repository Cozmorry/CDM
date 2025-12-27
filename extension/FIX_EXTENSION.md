# Fixing Extension Issues

## Problems Fixed

1. **Missing Permissions**: Added `contextMenus` and `notifications` to manifest
2. **Service Worker Errors**: Fixed initialization and error handling
3. **Download Interception**: Now checks settings before intercepting
4. **Native Messaging**: Improved error handling and timeout

## Steps to Fix

### 1. Reload the Extension

1. Go to `chrome://extensions/`
2. Find "Cozy Download Manager"
3. Click the refresh/reload icon
4. Check for errors (should be none now)

### 2. Install Native Messaging Host

**Important**: Update the extension ID first!

1. After reloading, note your extension ID from `chrome://extensions/`
2. Edit `com.cozy.downloadmanager.json`:
   - Replace `YOUR_EXTENSION_ID_HERE` with your actual extension ID
   - Update the `path` to your actual extension folder path
3. Run as Administrator:
   ```powershell
   cd extension
   .\install-native-messaging.ps1
   ```

### 3. Test Connection

1. Click the extension icon
2. Click "Test Connection"
3. Should show "Connected to CDM" if CDM is running

### 4. Test Download

1. Make sure CDM is running
2. Try downloading a file
3. It should be intercepted and sent to CDM

## Troubleshooting

### Extension shows "CDM is not running"

- Start Cozy Download Manager first
- Check that native messaging host is installed
- Verify extension ID matches in manifest

### Downloads still go to browser

- Check extension popup - is "Automatically intercept downloads" enabled?
- Check browser console (F12) for errors
- Verify native messaging host is installed correctly

### Native messaging connection fails

- Make sure Node.js is installed and in PATH
- Verify the path in `com.cozy.downloadmanager.json` is correct
- Check that `native-messaging-host.bat` exists
- Re-run `install-native-messaging.ps1`

## Manual Native Messaging Setup

If the script doesn't work, manually create registry entries:

```powershell
# For Chrome
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value "C:\full\path\to\com.cozy.downloadmanager.json"

# For Edge
New-Item -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Force
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value "C:\full\path\to\com.cozy.downloadmanager.json"
```


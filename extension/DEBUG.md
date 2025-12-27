# Debugging the Extension

## Check if Downloads are Being Detected

1. **Open Chrome DevTools:**
   - Press `F12` in Chrome
   - Go to **Console** tab
   - Filter by: `CDM Extension`

2. **Try downloading a file:**
   - Go to any website
   - Download a file
   - Look for these messages in console:
     - `[CDM Extension] ===== DOWNLOAD DETECTED =====`
     - `[CDM Extension] Download item:`
     - `[CDM Extension] Sending to CDM:`

## Check Service Worker Status

1. Go to `chrome://extensions/`
2. Find "Cozy Download Manager"
3. Click **"service worker"** link (should be blue/underlined)
4. This opens the service worker console
5. Look for:
   - `[CDM Extension] Service worker starting...`
   - `[CDM Extension] Registering download listener...`

## Check Native Messaging

1. In the service worker console, look for:
   - `[CDM Extension] Attempting to connect to native host:`
   - `[CDM Extension] Native messaging port created`
   - `[CDM Extension] Response from CDM:`

2. If you see errors:
   - `Native messaging error:` - Check if native messaging host is installed
   - `Connection timeout` - CDM might not be running or native host not responding

## Common Issues

### Downloads Not Detected
- **Service worker not active**: Reload extension
- **Auto-intercept disabled**: Check extension popup settings
- **Permission issue**: Check that `downloads` permission is granted

### Native Messaging Fails
- **Host not installed**: Run `.\install-native-messaging.ps1` as Admin
- **Wrong extension ID**: Check `com.cozy.downloadmanager.json` has correct ID
- **Path incorrect**: Verify batch file path in manifest

### CDM Not Launching
- **CDM not found**: Check if installed at `C:\Program Files\Cozy Download Manager`
- **Node.js not in PATH**: Native host needs Node.js
- **Permission denied**: Try running browser as Administrator

## Manual Test

1. **Test native messaging directly:**
   ```powershell
   cd extension
   node native-messaging-host.js
   ```
   Then type a JSON message (with length prefix) to test

2. **Check temp directory:**
   ```powershell
   ls $env:TEMP\cdm-downloads
   ```
   Should show JSON files if downloads are being sent

3. **Check CDM logs:**
   - Start CDM
   - Look for: `[Main] Watching for native messaging downloads in:`
   - Look for: `[Main] Native messaging download detected:`


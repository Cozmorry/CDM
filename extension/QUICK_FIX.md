# Quick Fix for Extension Errors

## Error 1: "Cannot read properties of undefined (reading 'onClicked')"
✅ **FIXED** - Added proper checks for contextMenus API availability

## Error 2: "Access to the specified native messaging host is forbidden"
🔧 **NEEDS ACTION** - Reinstall native messaging host

## Steps to Fix:

### 1. Reload Extension
- Go to `chrome://extensions/`
- Click reload on "Cozy Download Manager"

### 2. Reinstall Native Messaging Host

**IMPORTANT**: Your extension ID is `jafkfohjaifhaaodmogiekojigaogadc` (already updated ✅)

Run this as **Administrator**:

```powershell
cd C:\Users\cozmo\OneDrive\Desktop\CDM\extension
.\install-native-messaging.ps1
```

### 3. Verify Installation

Check registry:
```powershell
Get-ItemProperty "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager"
```

Should show the path to `com.cozy.downloadmanager.json`

### 4. Test

1. Start Cozy Download Manager
2. Click extension icon → "Test Connection"
3. Should show "Connected to CDM"

## If Still Not Working:

### Manual Registry Entry

```powershell
# Get your extension folder path
$manifestPath = "C:\Users\cozmo\OneDrive\Desktop\CDM\extension\com.cozy.downloadmanager.json"

# For Chrome
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value $manifestPath -Type String

# For Edge
New-Item -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Force
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager" -Name "(default)" -Value $manifestPath -Type String
```

### Verify Path in Manifest

Make sure `com.cozy.downloadmanager.json` has the correct path:
```json
{
  "path": "C:\\Users\\cozmo\\OneDrive\\Desktop\\CDM\\extension\\native-messaging-host.bat"
}
```

**Note**: Use double backslashes `\\` in JSON!


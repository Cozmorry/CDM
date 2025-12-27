# Release v1.0.2 - Browser Extension Integration

## 🌐 What's New

### Chromium Browser Extension
We've added seamless browser integration! The extension automatically intercepts downloads and sends them to CDM for faster, more reliable downloads.

**Key Features:**
- ✅ Automatic download interception
- ✅ User confirmation before starting downloads
- ✅ Smart pre-filling of download info
- ✅ Works with Chrome, Edge, Brave, and more
- ✅ Context menu support for manual downloads

## ✨ Highlights

### Seamless Browser Integration
- Downloads from your browser automatically open in CDM
- Review and confirm downloads before they start
- No more browser download dialogs - everything goes through CDM

### User Control
- **Confirmation Required**: All downloads require your approval
- **Pre-filled Info**: URL, filename, and size automatically detected
- **Edit Before Download**: Review and modify download details before starting

### Native Messaging
- Secure communication between browser and CDM
- Automatically launches CDM if not running
- Hidden background process (no CMD windows)

## 🚀 Quick Start

1. **Install the Extension**:
   - Load from `extension/` folder in developer mode
   - Or wait for Chrome Web Store release

2. **Install Native Messaging Host**:
   ```powershell
   cd extension
   .\install-native-messaging.ps1
   ```

3. **Start Downloading**:
   - Download files normally in your browser
   - CDM will open with the download ready for confirmation
   - Click "Start Download" to begin

## 🔧 Technical Improvements

- Native messaging host with proper stdio handling
- Hidden window execution (no visible CMD windows)
- File-based communication for reliability
- Automatic CDM path detection
- Improved error handling and connection status

## 🐛 Bug Fixes

- Fixed CMD window appearing when launching CDM
- Fixed native messaging connection timeouts
- Fixed download info not being passed correctly
- Improved error messages and troubleshooting

## 📦 Extension Package

Package the extension for Chrome Web Store:
```powershell
cd extension
.\package-extension.ps1
```

## 📋 Full Changelog

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for complete details.

---

**Download**: Extension files included in repository. See [Extension README](extension/README.md) for installation instructions.


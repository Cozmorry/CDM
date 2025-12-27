# Release Notes

## [1.0.2] - 2024-12-28

### 🌐 Browser Extension Integration

This major update introduces seamless browser integration with a Chromium extension that automatically intercepts downloads and sends them to CDM.

### ✨ New Features

#### Browser Extension
- **Chromium Extension**: Full support for Chrome, Edge, Brave, and other Chromium browsers
- **Automatic Download Interception**: Automatically captures browser downloads
- **User Confirmation Flow**: Opens download modal for user review before starting downloads
- **Smart Pre-filling**: Automatically fills URL, filename, and file size in download modal
- **Context Menu Support**: Right-click links/images/videos to download with CDM
- **Connection Testing**: Built-in connection test in extension popup
- **Settings Toggle**: Enable/disable automatic interception and notifications

#### Native Messaging
- **Secure Communication**: File-based native messaging between extension and CDM
- **Auto-Launch CDM**: Automatically launches CDM if not running when download is detected
- **Hidden Process**: Native messaging host runs without visible CMD windows
- **Robust Error Handling**: Improved error messages and connection status

#### Download Flow Improvements
- **Modal-Based Confirmation**: All downloads (including from extension) require user confirmation
- **Pre-filled Information**: Extension downloads automatically populate URL and filename
- **Auto-Fetch File Info**: Automatically fetches file information when modal opens from extension
- **No Auto-Downloads**: User always has control - no downloads start without confirmation

### 🔧 Technical Improvements

#### Extension Architecture
- **Service Worker**: Background service worker for download interception
- **Native Messaging Host**: Node.js-based host with proper stdio handling
- **File-Based Communication**: Reliable file-based communication for downloads
- **Multi-Launcher Support**: BAT → PowerShell → Node.js launcher chain for hidden execution

#### Native Messaging Host
- **Hidden Window Execution**: VBS/PowerShell launchers prevent CMD window visibility
- **Proper stdio Handling**: Maintains stdio connection for native messaging protocol
- **Path Detection**: Automatically finds CDM installation in multiple standard locations
- **Development Mode Support**: Works in both development and production environments

#### CDM Integration
- **File Watcher**: Monitors temp directory for extension download requests
- **IPC Communication**: Secure IPC messages between main process and renderer
- **Modal Auto-Open**: Automatically opens download modal when extension sends download
- **Window Management**: Shows and focuses CDM window when download is received

### 🐛 Bug Fixes

- Fixed CMD window appearing when launching CDM from extension
- Fixed native messaging connection timeouts
- Fixed download info not being passed from extension to CDM
- Fixed modal not opening when CDM receives extension download
- Improved error handling in native messaging host
- Fixed stdio connection issues with native messaging
- Resolved path detection issues for CDM installation

### 📦 Extension Packaging

- **Packaging Script**: `package-extension.ps1` for Chrome Web Store submission
- **Publishing Guide**: Complete guide for publishing to Chrome Web Store
- **File Organization**: Clear separation of extension files and native messaging host files
- **Version Management**: Proper versioning for extension updates

### 📝 Documentation

- Updated main README with browser extension section
- Comprehensive extension README with installation and troubleshooting
- Publishing guide for Chrome Web Store submission
- Native messaging setup instructions
- Troubleshooting guide for common extension issues

### 🎯 Files Added

#### Extension Files
- `extension/manifest.json` - Extension manifest (v3)
- `extension/background.js` - Service worker for download interception
- `extension/popup.html/js/css` - Extension popup UI
- `extension/icons/` - Extension icons (16x16, 32x32, 48x48, 128x128)

#### Native Messaging Host
- `extension/native-messaging-host.js` - Node.js native messaging host
- `extension/native-messaging-host.bat` - BAT launcher
- `extension/native-messaging-host-launcher.ps1` - PowerShell launcher
- `extension/native-messaging-host-launcher.vbs` - VBS launcher (alternative)
- `extension/com.cozy.downloadmanager.json` - Native messaging manifest
- `extension/install-native-messaging.ps1` - Installation script

#### Development & Documentation
- `extension/package-extension.ps1` - Extension packaging script
- `extension/PUBLISHING.md` - Chrome Web Store publishing guide
- `extension/README.md` - Extension documentation
- `extension/test-native-messaging.ps1` - Testing script

### 🚀 Installation

#### For Users

1. **Install CDM**: Download and install Cozy Download Manager
2. **Install Extension**: 
   - Load extension from `extension/` folder in developer mode
   - Or install from Chrome Web Store (when published)
3. **Install Native Messaging Host**:
   ```powershell
   cd extension
   .\install-native-messaging.ps1
   ```
4. **Restart Browser**: Restart your browser to activate the extension

#### For Developers

Package extension for Chrome Web Store:
```powershell
cd extension
.\package-extension.ps1
```

### 📋 Requirements

- Windows 10/11
- Node.js 24.12.0+ (for native messaging host)
- Chromium browser (Chrome, Edge, Brave, etc.)
- Cozy Download Manager installed

### 🔄 Migration Notes

- Existing CDM installations work without changes
- Extension is optional - CDM works standalone
- Native messaging host must be installed separately
- Extension ID must match in native messaging manifest

---

## [1.0.1] - 2024-12-27

### 🎨 Themed Installer Release

This update introduces a fully themed Windows installer with custom graphics and improved user experience.

### ✨ New Features

#### Themed Installer
- **Custom Dark Theme**: Installer now matches the app's indigo/purple color scheme
- **Custom Graphics**: Header images, welcome page, and finish page graphics
- **Professional Appearance**: Modern, polished installer interface
- **Multi-Page Installer**: Full installation wizard with customizable options
- **Custom Welcome Text**: Branded welcome message and descriptions

#### Installer Improvements
- **Icon Support**: Proper ICO format support for Windows installer
- **Custom Finish Page**: Improved finish page with better text visibility
- **Installation Options**: 
  - Choose installation directory
  - Create desktop shortcut
  - Create start menu shortcut
- **License Display**: Shows MIT license during installation

### 🔧 Technical Improvements

#### Build System
- Fixed NSIS installer configuration conflicts
- Resolved icon format issues (PNG to ICO conversion)
- Fixed bitmap path resolution for installer graphics
- Improved installer script compatibility with electron-builder
- Added proper icon handling for both PNG (app) and ICO (installer)

#### Installer Script
- Custom NSIS script (`build/installer.nsh`) with dark theme
- Custom color definitions matching app theme
- Header image support
- Welcome and finish page customization
- Improved text color handling for better visibility

### 🐛 Bug Fixes

- Fixed installer build errors related to NSIS configuration conflicts
- Fixed icon format issues preventing installer creation
- Fixed bitmap file path resolution in installer script
- Fixed finish page checkbox text color visibility
- Resolved code signing tool extraction errors (disabled for development)
- Fixed duplicate definition errors in NSIS script

### 📦 Build Improvements

- Added icon conversion script (`build/convert-icon-to-ico.ps1`)
- Added placeholder graphics generation script
- Improved build documentation and guides
- Added multiple build targets (installer, portable, directory)
- Enhanced build error handling

### 📝 Documentation

- Added comprehensive installer setup guide (`THEMED_INSTALLER_SETUP.md`)
- Created installer graphics creation guide (`build/INSTALLER_THEME.md`)
- Added build directory documentation
- Updated README with installer information

### 🎯 Files Changed

- `build/installer.nsh` - Custom NSIS installer script with theming
- `package.json` - Updated NSIS configuration
- `build/convert-icon-to-ico.ps1` - Icon conversion utility
- `build/generate-placeholder-graphics.ps1` - Graphics generation script
- Various documentation files

### 🚀 Installation

Build the themed installer:
```bash
npm run build
```

The installer will be created at:
```
dist/Cozy Download Manager-1.0.0-Setup.exe
```

### 📋 Requirements

- Windows 10/11
- Node.js 24.12.0+
- Electron 28.0.0+
- electron-builder 24.9.1+

---

## [1.0.0] - 2024-12-27

### 🎉 Initial Release

The first stable release of Cozy Download Manager - a professional-grade download manager built with Electron.

### ✨ Features

#### Core Functionality
- **Multi-Segment Downloads**: Automatically splits large files into multiple segments (up to 16) for maximum speed
- **High-Performance Engine**: Optimized JavaScript download engine using Node.js native HTTP/HTTPS modules
- **Intelligent Queue Management**: Priority-based queue system with configurable concurrent downloads
- **Download Persistence**: Automatic state saving and resume capability after app restart
- **Download History**: Complete history tracking of all completed downloads

#### User Interface
- **Modern, Minimal Design**: Clean and professional UI with indigo/purple accent theme
- **Drag & Drop Support**: Drag URLs directly into the application or paste with Ctrl+V
- **Clipboard Auto-Detection**: Automatically detects and fills URLs from clipboard
- **Two-Step Download Process**: Review and edit filename and download path before starting
- **Real-Time Progress**: Live progress bars with download speed and ETA
- **Tabbed Interface**: Separate views for Active/Queue, Completed, and History
- **Compact Window**: Opens in a mini window by default, similar to professional download managers

#### Advanced Features
- **Duplicate Detection**: Prevents duplicate downloads with skip/replace options
- **Auto-Switch to Completed**: Automatically switches to completed tab when all downloads finish
- **Settings Persistence**: Remembers download path and preferences
- **File Management**: Open files or show in folder directly from the app
- **Priority System**: High, Normal, and Low priority levels with queue manipulation
- **Bandwidth Control**: Configurable bandwidth limiting
- **Smart Retry Logic**: Automatic retry with configurable attempts and delays

### 🎨 UI/UX Improvements
- Modern color scheme with indigo/purple gradients
- Smooth animations and transitions
- Enhanced hover effects and visual feedback
- Professional icon integration (React Icons)
- Responsive modal dialogs with scrollable content
- Improved typography and spacing
- Custom scrollbars and visual polish

### 🔧 Technical Details
- Built with Electron 28.0.0
- Node.js 24.12.0
- React Icons for professional iconography
- Event-driven architecture for optimal performance
- Efficient memory management with streaming file writes
- Robust error handling and recovery

### 📦 Installation

```bash
npm install
npm start
```

### 🐛 Bug Fixes
- Fixed IPC serialization errors for download data
- Fixed duplicate download detection
- Fixed modal overflow issues
- Fixed drag-drop zone visibility
- Fixed URL truncation in download items
- Fixed SSL certificate handling for testing

### 📝 Documentation
- Comprehensive README with badges and screenshots section
- MIT License included
- Setup and usage instructions
- Technical documentation

### 🙏 Acknowledgments

Built with Electron and Node.js. Inspired by professional download managers like Free Download Manager (FDM) and Internet Download Manager (IDM).

---

**Full Changelog**: See [README.md](README.md) for complete feature list and documentation.

---

## Version History

- **v1.0.2** (2024-12-28): Browser extension integration, native messaging, user confirmation flow
- **v1.0.1** (2024-12-27): Themed installer, build improvements, documentation
- **v1.0.0** (2024-12-27): Initial release with multi-segment downloads, queue management, and modern UI


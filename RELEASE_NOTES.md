# Release Notes

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


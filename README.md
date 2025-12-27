# Cozy Download Manager (CDM)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.2-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Electron](https://img.shields.io/badge/electron-28.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-24.12.0-brightgreen.svg)

A professional-grade, sophisticated download manager built with Electron - comparable to Free Download Manager (FDM) and Internet Download Manager (IDM).

## 📸 Screenshots

### Main Interface
![Main Interface](screenshots/main-interface.png)
*Clean and minimal interface with drag-and-drop support*

### Download Progress
![Download Progress](screenshots/download-progress.png)
*Real-time progress tracking with speed and ETA*

### Settings Panel
![Settings Panel](screenshots/settings.png)
*Comprehensive settings for download management*

> **Note**: Screenshots should be placed in a `screenshots/` directory. Add your actual screenshots there and they will be displayed above.

## ✨ Features

### 🚀 Advanced Download Engine
- **Multi-Segment Downloads**: Automatically splits large files into multiple segments (up to 16) for maximum speed
- **High-Performance Engine**: Optimized JavaScript with Node.js native HTTP/HTTPS modules
- **Intelligent Chunking**: Optimizes segment size based on file size and server capabilities
- **Range Request Support**: Automatically detects and uses HTTP Range requests for resumable downloads
- **Smart Retry Logic**: Automatic retry with exponential backoff on failures
- **Bandwidth Management**: Configurable bandwidth limiting to control network usage

### 🌐 Browser Extension Integration
- **Chromium Extension**: Seamless integration with Chrome, Edge, Brave, and other Chromium browsers
- **Automatic Download Interception**: Automatically captures browser downloads and sends them to CDM
- **Smart Download Detection**: Detects download URLs, filenames, and metadata from browser
- **User Confirmation**: Opens download modal for user verification before starting downloads
- **Native Messaging**: Secure communication between browser extension and CDM
- **Context Menu Support**: Right-click links/images/videos to download with CDM

### 📊 Queue Management
- **Priority System**: High, Normal, and Low priority levels
- **Concurrent Downloads**: Configurable maximum concurrent downloads (1-10)
- **Queue Control**: Move downloads up/down in queue, change priorities on the fly
- **Auto-Queue**: Automatically starts next download when one completes

### 💾 Persistence & Recovery
- **State Persistence**: Automatically saves download state to disk
- **Resume Capability**: Resume interrupted downloads after app restart
- **Download History**: Tracks completed downloads with metadata
- **Auto-Recovery**: Restores incomplete downloads on startup

### 🎯 Advanced Features
- **Real-time Progress**: Live progress bars with speed and ETA
- **Download Statistics**: Track active, queued, and completed downloads
- **File Management**: Open files or show in folder directly from the app
- **Settings Panel**: Comprehensive settings for all download parameters
- **Tabbed Interface**: Separate views for Active/Queue, Completed, and History
- **Drag-and-Drop**: Drag URLs directly into the app or paste from clipboard
- **Duplicate Detection**: Prevents duplicate downloads with skip/replace options
- **Auto-Switch Views**: Automatically switches to "Completed" tab when all downloads finish

### 🔧 Technical Excellence
- **High-Performance Networking**: Uses Node.js native HTTP/HTTPS modules
- **Multi-threaded Downloads**: Parallel segment downloads using async operations
- **Efficient Memory Management**: Streaming file writes for large downloads
- **Event-Driven Architecture**: Optimized for performance and responsiveness
- **Event-Driven Architecture**: Efficient event-based communication
- **Memory Efficient**: Smart memory management for large file downloads
- **Error Handling**: Robust error handling with detailed error messages

## 📦 Installation

### System Requirements

- **Operating System**: Windows 10 (64-bit) or Windows 11
- **RAM**: 4GB minimum (8GB recommended for large downloads)
- **Disk Space**: 200MB for installation + space for your downloads
- **Internet Connection**: Required for downloads
- **Optional**: Node.js (only needed for browser extension native messaging host)

### For End Users (Installer)

If you downloaded the Windows installer (`.exe` file) from the releases:

If you downloaded the Windows installer (`.exe` file) from the releases:

1. **Download the Installer**
   - Download `Cozy Download Manager-X.X.X-Setup.exe` from the [Releases](https://github.com/yourusername/CDM/releases) page
   - The installer is typically 80-90MB in size

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - If Windows shows a security warning, click "More info" → "Run anyway"
   - The installer will open with a dark-themed interface

3. **Follow the Installation Wizard**
   - **Welcome Page**: Click "Next" to begin
   - **License Agreement**: Review the MIT License and click "I Agree"
   - **Installation Location**: Choose where to install (default: `C:\Program Files\Cozy Download Manager`)
   - **Shortcuts**: Choose whether to create desktop and start menu shortcuts
   - **Install**: Click "Install" to begin installation
   - **Finish**: Click "Finish" to complete (optionally launch CDM immediately)

4. **Launch CDM**
   - Find "Cozy Download Manager" in your Start Menu, or
   - Double-click the desktop shortcut (if created), or
   - Navigate to the installation folder and run `Cozy Download Manager.exe`

5. **First Launch**
   - CDM will open in a compact window
   - Set your download path in Settings (⚙️ button)
   - Start downloading!

### Installation Troubleshooting

**Windows Defender / Antivirus Warning**
- If Windows SmartScreen shows a warning, click "More info" → "Run anyway"
- This is normal for unsigned applications (code signing can be added later)
- The installer is safe - you can verify the source code on GitHub

**Installation Fails**
- Make sure you have administrator privileges
- Check that you have enough disk space (200MB+)
- Try running the installer as Administrator (right-click → "Run as administrator")

**CDM Won't Launch After Installation**
- Check Windows Event Viewer for error messages
- Make sure all files were installed correctly
- Try reinstalling the application

**Uninstalling**
- Go to Windows Settings → Apps → Apps & features
- Find "Cozy Download Manager" and click "Uninstall"
- Or use the uninstaller from Start Menu

### For Developers (Source Code)

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```


## 🛠️ Development

To run in development mode with DevTools:
```bash
npm run dev
```

## 🏗️ Building

To build the application for distribution:
```bash
npm run build
```

This creates a Windows installer in the `dist/` directory.

### Building Optimized Version

For a smaller package size (removes unnecessary locale files):
```bash
npm run build:optimized
```

## 🌐 Browser Extension Setup (Optional)

CDM includes a Chromium browser extension for seamless download integration. This is **optional** - CDM works perfectly fine without it.

### Quick Setup

1. **Install the Extension**:
   - Download the extension from the [Releases](https://github.com/yourusername/CDM/releases) page
   - Or load from `extension/` folder in developer mode
   - See [Extension README](extension/README.md) for detailed instructions

2. **Install Native Messaging Host**:
   - Open PowerShell as Administrator
   - Navigate to the extension folder:
     ```powershell
     cd path\to\CDM\extension
     ```
   - Run the installation script:
     ```powershell
     .\install-native-messaging.ps1
     ```

3. **Restart Your Browser**:
   - Close and reopen Chrome/Edge/Brave to activate the extension

4. **Start Downloading**:
   - Downloads from your browser will automatically open in CDM
   - Review and confirm downloads in the modal before they start

**Note**: The native messaging host requires Node.js to be installed. If you don't have Node.js, you can:
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Or use CDM without the browser extension (it works standalone)

For complete extension setup and publishing instructions, see:
- [Extension README](extension/README.md) - Installation and usage
- [Extension Publishing Guide](extension/PUBLISHING.md) - Publishing to Chrome Web Store

## 🚀 Quick Start

After installation:

1. **Launch CDM** from Start Menu or desktop shortcut
2. **Add a Download**:
   - Click "Add Download" button, or
   - Drag a URL into the center panel, or
   - Paste a URL with Ctrl+V
3. **Review Download Info**: Check the URL, filename, and file size
4. **Click "Start Download"**: Your download will begin with multi-segment support!

**Pro Tip**: Install the browser extension to automatically send downloads from Chrome/Edge to CDM!

## 📖 Usage

### Adding Downloads

**Method 1: Manual Entry**
1. Click "Add Download" button
2. Enter the download URL (or paste from clipboard with Ctrl+V)
3. Click "Get File Info" to fetch file details
4. Review and edit filename if needed
5. Select priority (High, Normal, or Low)
6. Click "Start Download"

**Method 2: Drag-and-Drop**
1. Drag a URL from your browser into the center panel
2. The download modal will open automatically with the URL pre-filled
3. Follow steps 3-6 from Method 1

**Method 3: Browser Extension** (Recommended)
1. Install the [Cozy Download Manager Extension](extension/README.md)
2. Download files normally in your browser
3. CDM will automatically open with the download info pre-filled
4. Review and confirm the download in the modal
5. Click "Start Download"

### Managing Downloads

- **Pause/Resume**: Click pause/resume buttons on active downloads
- **Change Priority**: Click "Priority" button to cycle through priority levels
- **Queue Control**: Use "Up" and "Down" buttons to reorder queued downloads
- **Cancel**: Cancel any non-completed download
- **Open Files**: Click "Open" to open completed files, or "Show in Folder" to reveal in file explorer

### Settings

Access settings via the ⚙️ button in the header:

- **Download Path**: Set custom download location
- **Max Concurrent Downloads**: Control how many downloads run simultaneously (1-10)
- **Max Segments**: Number of parallel segments per download (1-16)
- **Bandwidth Limit**: Set maximum download speed in KB/s (0 = unlimited)
- **Retry Attempts**: Number of retries on failure (1-10)
- **Retry Delay**: Delay between retries in milliseconds

## 🎛️ Configuration

### Default Settings

- Max Concurrent Downloads: 3
- Max Segments per Download: 8
- Bandwidth Limit: Unlimited (0)
- Retry Attempts: 3
- Retry Delay: 1000ms
- Min Segment Size: 1MB

### Data Storage

- Downloads: `[Your Downloads Folder]/CDM/`
- App Data: `[App Data]/CDM-Data/`
  - `downloads.json` - Download state
  - `settings.json` - User settings
  - `history.json` - Download history

## 🔬 Technical Details

### High-Performance Implementation

The download engine uses optimized JavaScript with Node.js native modules:

- **Native HTTP/HTTPS**: Uses Node.js built-in modules for optimal performance
- **Multi-threading**: Parallel segment downloads using async operations
- **Memory Management**: Efficient streaming for large file downloads
- **I/O Operations**: Optimized file I/O with Node.js streams

### Multi-Segment Download Algorithm

1. **Detection**: Checks if server supports HTTP Range requests
2. **Segmentation**: Calculates optimal number of segments based on file size
3. **Parallel Download**: Downloads all segments simultaneously using async operations
4. **Merging**: Combines segments into final file after completion
5. **Resume**: Can resume individual segments if interrupted

### Queue System

- Priority-based queue with automatic promotion
- Configurable concurrent download limit
- Automatic queue processing
- Manual queue manipulation

### Performance

- **Download Speeds**: ~50-200+ MB/s (depending on network and server)
- **Multi-segment downloads** can achieve speeds up to 8x faster on supported servers
- **Efficient memory usage** with streaming file writes
- **Low CPU overhead** with event-driven architecture
- **Bandwidth optimization** with configurable limits

## 🚀 Performance Benefits

The optimized download engine provides:

- **Fast download speeds** - up to 200+ MB/s depending on network
- **Multi-segment downloads** - up to 8x faster on supported servers
- **Efficient memory usage** - streaming file writes
- **Low CPU overhead** - event-driven architecture
- **Bandwidth optimization** - configurable limits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Browser Extension

CDM includes a Chromium browser extension for seamless browser integration. The extension:

- **Automatically intercepts** browser downloads
- **Opens CDM modal** for user confirmation (no auto-downloads)
- **Pre-fills download info** (URL, filename, size)
- **Works with Chrome, Edge, Brave**, and other Chromium browsers

See the [Extension README](extension/README.md) for installation and usage.

## 📦 Distribution

### Windows Installer

Build a Windows installer:
```bash
npm run build
```

The installer will be in `dist/` directory with:
- Custom dark-themed installer UI
- Automatic desktop shortcut creation
- Program Files installation
- Uninstaller support

### Browser Extension

Package the extension for Chrome Web Store:
```powershell
cd extension
.\package-extension.ps1
```

See [Extension Publishing Guide](extension/PUBLISHING.md) for Chrome Web Store submission.

## 🙏 Acknowledgments

Built with Electron and Node.js. Inspired by professional download managers like FDM and IDM.

---

**Note**: This is a sophisticated download manager with professional-grade features. The download engine uses advanced networking techniques to maximize download speeds while maintaining reliability and user control. The browser extension provides seamless integration while respecting user choice through confirmation dialogs.

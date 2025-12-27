# Release v1.0.1 - Themed Installer

## 🎨 What's New

### Themed Windows Installer
We've completely redesigned the Windows installer to match your app's beautiful dark theme! The installer now features:

- **Custom Dark Theme** - Matches the app's indigo/purple color scheme
- **Custom Graphics** - Professional header images and welcome/finish page graphics
- **Improved UX** - Better text visibility and polished interface
- **Multi-Page Wizard** - Full installation experience with customizable options

## ✨ Features

- Custom installer graphics (header, welcome, finish pages)
- Dark theme matching app design
- Custom welcome and finish page text
- Proper icon support (ICO format)
- Installation directory selection
- Desktop and Start Menu shortcut options
- License display during installation

## 🔧 Technical Changes

- Fixed NSIS installer configuration conflicts
- Resolved icon format issues (PNG to ICO conversion)
- Fixed bitmap path resolution
- Improved installer script compatibility
- Added icon conversion utilities
- Enhanced build documentation

## 🐛 Bug Fixes

- Fixed installer build errors
- Fixed finish page text color visibility
- Resolved code signing tool extraction errors
- Fixed duplicate definition errors in NSIS script

## 📦 Installation

Build the installer:
```bash
npm run build
```

The installer will be created at:
```
dist/Cozy Download Manager-1.0.0-Setup.exe
```

## 📋 Full Changelog

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for complete details.

---

**Download**: [Cozy Download Manager-1.0.0-Setup.exe](dist/Cozy%20Download%20Manager-1.0.0-Setup.exe)


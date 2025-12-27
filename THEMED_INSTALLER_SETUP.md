# Themed Installer Setup Guide

Your installer is now configured with custom theming! Follow these steps to complete the setup.

## ✅ What's Been Configured

1. **NSIS Installer Settings** - Multi-page installer with custom options
2. **Custom NSIS Script** - `build/installer.nsh` with dark theme matching your app
3. **Installer Graphics** - Placeholder generation script ready
4. **Documentation** - Complete guides in `build/` directory

## 🚀 Quick Start (3 Steps)

### Step 1: Create Installer Graphics

**Option A: Generate Placeholders (Fast)**
```powershell
cd build
.\generate-placeholder-graphics.ps1
```

**Option B: Create Custom Graphics**
- Read `build/INSTALLER_THEME.md` for detailed instructions
- Create graphics matching your app's indigo/purple theme
- Save as 24-bit BMP files in `build/` directory

Required files:
- `build/installer-header.bmp` (150x57px)
- `build/installer-welcome.bmp` (164x314px)
- `build/installer-finish.bmp` (164x314px)

### Step 2: Convert Icon (If Needed)

If you only have `assets/icon.png`, convert it to `.ico`:

**Using Online Tool:**
- Visit: https://www.icoconverter.com/
- Upload `assets/icon.png`
- Download as `icon.ico`
- Place in `assets/icon.ico`

**Using PowerShell:**
```powershell
# Install ImageMagick first, then:
magick convert assets/icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

### Step 3: Build the Installer

```bash
npm run build
```

The themed installer will be created in `dist/` directory as:
- `Cozy Download Manager-1.0.0-Setup.exe`

## 🎨 Installer Features

Your themed installer includes:

- ✅ **Custom Graphics**: Header, welcome, and finish page images
- ✅ **Dark Theme**: Matches your app's indigo/purple color scheme
- ✅ **Multi-Page Installer**: Professional installation wizard
- ✅ **Customizable Options**: 
  - Choose installation directory
  - Create desktop shortcut
  - Create start menu shortcut
- ✅ **License Display**: Shows MIT license during installation
- ✅ **Finish Page Options**:
  - Launch app after installation
  - View README
  - Visit GitHub repository

## 📁 File Structure

```
CDM/
├── build/
│   ├── installer.nsh                    # Custom NSIS script
│   ├── installer-header.bmp              # Header image (create this)
│   ├── installer-welcome.bmp             # Welcome sidebar (create this)
│   ├── installer-finish.bmp              # Finish sidebar (create this)
│   ├── generate-placeholder-graphics.ps1 # Graphics generator
│   ├── INSTALLER_THEME.md                # Detailed guide
│   └── README.md                         # Build directory docs
├── assets/
│   ├── icon.ico                          # Installer icon (convert if needed)
│   └── icon.png                          # Source icon
└── package.json                          # Updated with NSIS config
```

## 🎨 Color Scheme

The installer uses your app's dark theme:

- **Background**: `#0F0F23` (Dark blue-black)
- **Text**: `#F8FAFC` (Light gray)
- **Accent**: `#6366F1` (Indigo)
- **Secondary**: `#8B5CF6` (Purple)

## 🔧 Customization

### Change Installer Text

Edit `build/installer.nsh`:
- Welcome page title and text
- Finish page options
- Custom installer pages

### Change Colors

Edit `build/installer.nsh`:
```nsis
!define MUI_BGCOLOR YOUR_COLOR
!define MUI_TEXTCOLOR YOUR_TEXT_COLOR
```

### Change Installer Behavior

Edit `package.json` → `build.nsis`:
- `oneClick`: true/false (one-click vs multi-page)
- `allowToChangeInstallationDirectory`: true/false
- `createDesktopShortcut`: true/false
- And more...

## 📚 Documentation

- **`build/INSTALLER_THEME.md`** - Complete guide for creating graphics
- **`build/create-installer-graphics.md`** - Quick reference
- **`build/README.md`** - Build directory overview

## 🐛 Troubleshooting

### Graphics Not Showing
- Ensure files are **24-bit BMP** format
- Check file names match exactly
- Verify files are in `build/` directory

### Icon Not Working
- Convert PNG to ICO format
- Ensure `assets/icon.ico` exists
- Use multi-resolution ICO (16, 32, 48, 64, 128, 256px)

### Build Errors
- Check that all required files exist
- Verify NSIS script syntax in `installer.nsh`
- Check electron-builder version compatibility

## 🎯 Next Steps

1. Generate or create installer graphics
2. Convert icon to ICO format (if needed)
3. Test build: `npm run build`
4. Customize further as needed

## 📖 Resources

- [Electron Builder NSIS Options](https://www.electron.build/configuration/nsis)
- [NSIS Modern UI Documentation](https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html)
- [ICO Converter](https://www.icoconverter.com/)

---

**Ready to build?** Run `npm run build` after creating the graphics!


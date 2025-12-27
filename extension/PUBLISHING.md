# Publishing Cozy Download Manager Extension to Chrome Web Store

## Prerequisites

1. **Chrome Web Store Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Pay the one-time $5 registration fee (if not already paid)

2. **Extension Package**
   - Run the packaging script to create a ZIP file

## Step 1: Package the Extension

Run the packaging script to create a ZIP file with only the necessary files:

```powershell
cd extension
.\package-extension.ps1
```

This will create `cozy-download-manager-extension-v1.0.0.zip` in the parent directory.

**Important:** The package includes ONLY:
- `manifest.json`
- `background.js`
- `popup.html`, `popup.css`, `popup.js`
- `icons/` folder

**Excluded files** (not needed in the package):
- Native messaging host files (installed separately by users)
- Installation scripts
- Test scripts
- Documentation files

## Step 2: Prepare Store Listing

Before uploading, prepare:

### Required Information

1. **Name**: Cozy Download Manager
2. **Short Description**: Automatically send downloads to Cozy Download Manager
3. **Detailed Description**: 
   ```
   Cozy Download Manager Extension automatically intercepts browser downloads 
   and sends them to Cozy Download Manager for faster, more reliable downloads 
   with multi-segment support.
   
   Features:
   - Automatic download interception
   - Seamless integration with Cozy Download Manager
   - Smart download detection
   - Configurable settings
   - Modern dark theme UI
   
   Note: Requires Cozy Download Manager to be installed on your system.
   ```
4. **Category**: Productivity or Utilities
5. **Language**: English (and others if you have translations)

### Screenshots

You'll need:
- **Small tile (440x280)**: Extension icon or popup screenshot
- **Marquee (920x680)**: Main feature showcase
- **Screenshots (1280x800 or 640x400)**: 
  - Extension popup UI
  - Settings interface
  - Download in action

### Privacy Policy

You'll need a privacy policy URL. The extension:
- Uses `nativeMessaging` to communicate with local CDM app
- Stores user preferences locally (`chrome.storage.sync`)
- Does NOT collect or transmit any user data
- Does NOT track users
- Does NOT use analytics

Example privacy policy (host on GitHub Pages or your website):
```
Privacy Policy for Cozy Download Manager Extension

Last updated: [Date]

This extension does not collect, store, or transmit any personal information.

Local Storage:
- The extension stores user preferences (auto-intercept setting, notifications) locally using Chrome's storage API
- This data never leaves your device

Native Messaging:
- The extension communicates with the locally installed Cozy Download Manager application
- All communication is local to your computer
- No data is sent to external servers

We do not:
- Collect personal information
- Track user behavior
- Use analytics
- Share data with third parties
```

## Step 3: Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload the ZIP file (`cozy-download-manager-extension-v1.0.0.zip`)
4. Fill in the store listing:
   - **Name**: Cozy Download Manager
   - **Summary**: Brief description (132 characters max)
   - **Description**: Detailed description (see above)
   - **Category**: Productivity or Utilities
   - **Language**: Select your languages
   - **Screenshots**: Upload required screenshots
   - **Privacy Policy**: URL to your privacy policy
5. Click **"Submit for Review"**

## Step 4: Native Messaging Host Installation

**Important:** The extension requires users to install the native messaging host separately. 

### Installation Instructions for Users

Add clear instructions to your extension description:

```
INSTALLATION INSTRUCTIONS:

1. Install Cozy Download Manager:
   - Download and install CDM from [your website/GitHub]
   - Default installation: C:\Program Files\Cozy Download Manager

2. Install Native Messaging Host:
   - Download the extension source code
   - Open PowerShell as Administrator
   - Navigate to the extension folder
   - Run: .\install-native-messaging.ps1

3. Restart your browser

4. Test the connection:
   - Click the extension icon
   - Click "Test Connection"
   - Should show "Extension connected"

The extension will automatically intercept downloads and open them in CDM 
for your review and confirmation before starting.
```

### Option B: Create an Installer Package

For a better user experience, create a combined installer that:
1. Installs CDM (if not already installed)
2. Installs the native messaging host
3. Registers the extension ID
4. Verifies the setup

This can be included with CDM's installer or distributed separately.

## Step 5: Review Process

- **Review Time**: Usually 1-3 business days
- **Common Rejection Reasons**:
  - Missing privacy policy
  - Insufficient description
  - Missing screenshots
  - Native messaging host not properly documented

## Step 6: Updates

To update the extension:

1. Update `version` in `manifest.json`
2. Run `package-extension.ps1` again
3. Go to your extension in Developer Dashboard
4. Click **"Package"** → **"Upload Updated Package"**
5. Upload the new ZIP file
6. Submit for review

## Version Numbering

Follow semantic versioning:
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes

Update in `manifest.json`:
```json
{
  "version": "1.0.1"
}
```

## Troubleshooting

### Extension Rejected

Common issues:
- **Privacy Policy Missing**: Add a privacy policy URL
- **Native Messaging Not Documented**: Clearly explain in description that CDM must be installed
- **Screenshots Missing**: Upload all required screenshots
- **Description Too Vague**: Be specific about what the extension does

### Users Can't Connect

Make sure your documentation includes:
- Native messaging host installation instructions
- Troubleshooting guide
- Link to CDM download/installation

## Additional Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Extension Publishing Checklist](https://developer.chrome.com/docs/webstore/publish/)
- [Native Messaging Documentation](https://developer.chrome.com/docs/apps/nativeMessaging/)


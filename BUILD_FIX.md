# Fixing the Code Signing Build Error

The build is failing because electron-builder is trying to extract code signing tools that contain symbolic links, which requires administrator privileges on Windows.

## Solution 1: Enable Windows Developer Mode (Recommended)

This allows creating symbolic links without administrator privileges:

1. Press `Win + I` to open Settings
2. Go to **Privacy & Security** → **For developers**
3. Enable **Developer Mode**
4. Restart your computer (or just restart PowerShell)
5. Run the build again: `npm run build`

## Solution 2: Run PowerShell as Administrator

1. Right-click PowerShell
2. Select **Run as Administrator**
3. Navigate to your project: `cd C:\Users\cozmo\OneDrive\Desktop\CDM`
4. Run: `npm run build`

## Solution 3: Skip Code Signing Completely (Workaround)

If the above don't work, we can modify electron-builder to skip code signing entirely by using a custom build configuration.

## Solution 4: Use Portable Build (No Installer)

Build just the portable app without an installer:

```powershell
npm run build -- --dir
```

This creates the unpacked app in `dist/win-unpacked` without creating an installer.

---

**Recommended**: Try Solution 1 (Developer Mode) first - it's the cleanest solution and will fix the issue permanently.



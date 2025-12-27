# Size Optimization Guide

## Why is the app 89MB?

Electron apps are large because they bundle:
- **Chromium** (~60-70MB) - The browser engine (unavoidable)
- **Node.js runtime** (~10-15MB) - JavaScript runtime
- **Locale files** (~10-15MB) - 50+ language packs
- **Your app code** (~2-5MB) - Your actual application

## Optimization Strategies

### 1. Remove Unnecessary Locales (Saves ~10-15MB)

The app includes 50+ language packs, but you only need English:

```powershell
# After building, run:
.\build\optimize-size.ps1
```

This removes all locales except English, saving ~10-15MB.

### 2. Use Maximum Compression (Already Enabled)

The build configuration now uses:
- `"compression": "maximum"` - Maximum NSIS compression
- `"asar": true` - Packages app files in ASAR archive

### 3. Optimize Dependencies

**react-icons** is a large dependency (~5MB). Consider:
- Using only specific icons instead of the full package
- Or using a lighter icon library

### 4. Exclude Unnecessary Files (Already Configured)

The build now excludes:
- `node_modules` (only production deps included)
- Source maps (`*.map` files)

## Expected Size After Optimization

- **Before**: ~89MB
- **After locale removal**: ~75-80MB
- **After dependency optimization**: ~70-75MB

## Limitations

**You cannot reduce below ~60-70MB** because:
- Chromium is required for Electron (can't be removed)
- Node.js runtime is required
- Windows DLLs and system files are required

## Alternative: Use a Lighter Framework

If size is critical, consider:
- **Tauri** (~5-10MB) - Uses system browser instead of bundling Chromium
- **Native Windows app** (C#/C++) - Smallest size but more development work

## Running Optimizations

1. **Build the app:**
   ```powershell
   npm run build
   ```

2. **Remove unnecessary locales:**
   ```powershell
   .\build\optimize-size.ps1
   ```

3. **Rebuild installer** (if needed):
   ```powershell
   npm run build
   ```

## Size Breakdown (After Optimization)

- Chromium: ~55-60MB (unavoidable)
- Node.js: ~10MB (unavoidable)
- Locales (English only): ~1-2MB
- App code: ~2-5MB
- **Total**: ~70-75MB

## Further Optimization Ideas

1. **Use Electron's `asar` compression** (already enabled)
2. **Remove unused Chromium features** (advanced, risky)
3. **Use a CDN for large assets** (if applicable)
4. **Lazy load dependencies** (if using large libraries)

## Note

89MB is actually **reasonable for an Electron app**. Popular Electron apps:
- VS Code: ~200MB+
- Discord: ~150MB+
- Slack: ~200MB+
- Spotify: ~150MB+

Your 89MB (or 70MB optimized) is quite good!


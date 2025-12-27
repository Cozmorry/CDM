# Package Extension for Chrome Web Store
# This script creates a .zip file with only the necessary extension files

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$extensionDir = $scriptDir
$packageName = "cozy-download-manager-extension-v1.0.0.zip"
$parentDir = Split-Path -Parent $scriptDir
$packagePath = Join-Path $parentDir $packageName

Write-Host "Packaging extension for Chrome Web Store..." -ForegroundColor Cyan

# Files to include in the package
$filesToInclude = @(
    "manifest.json",
    "background.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "icons"
)

# Create temporary directory for packaging
$tempDir = Join-Path $env:TEMP "cdm-extension-package"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying extension files..." -ForegroundColor Yellow

# Copy files
foreach ($item in $filesToInclude) {
    $sourcePath = Join-Path $extensionDir $item
    $destPath = Join-Path $tempDir $item
    
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            # Directory
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "  ✓ Copied directory: $item" -ForegroundColor Green
        } else {
            # File
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "  ✓ Copied file: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠ Warning: $item not found" -ForegroundColor Yellow
    }
}

# Create ZIP file
Write-Host ""
Write-Host "Creating ZIP package..." -ForegroundColor Yellow
if (Test-Path $packagePath) {
    Remove-Item $packagePath -Force
}

# Use .NET compression to create ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $packagePath)

# Clean up
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host "  Location: $packagePath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to Chrome Web Store Developer Dashboard" -ForegroundColor White
Write-Host "  2. Create a new item or update existing one" -ForegroundColor White
Write-Host "  3. Upload the ZIP file: $packageName" -ForegroundColor White
Write-Host "  4. Fill in store listing details" -ForegroundColor White
Write-Host "  5. Submit for review" -ForegroundColor White


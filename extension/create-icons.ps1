# PowerShell script to create extension icons from assets/icon.png

Add-Type -AssemblyName System.Drawing

$sourceIcon = Join-Path $PSScriptRoot "..\assets\icon.png"
$iconsDir = Join-Path $PSScriptRoot "icons"

# Create icons directory
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

if (-not (Test-Path $sourceIcon)) {
    Write-Host "Error: icon.png not found at $sourceIcon" -ForegroundColor Red
    exit 1
}

$sizes = @(16, 32, 48, 128)

try {
    $sourceImage = [System.Drawing.Image]::FromFile($sourceIcon)
    
    foreach ($size in $sizes) {
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # High-quality rendering
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Draw resized image
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
        
        # Save as PNG
        $outputPath = Join-Path $iconsDir "icon$size.png"
        $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graphics.Dispose()
        $bitmap.Dispose()
        
        Write-Host "Created icon$size.png" -ForegroundColor Green
    }
    
    $sourceImage.Dispose()
    Write-Host "`nAll icons created successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error creating icons: $_" -ForegroundColor Red
    exit 1
}


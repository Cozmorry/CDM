# Test script to verify native messaging host works

Write-Host "Testing Native Messaging Host..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js not found in PATH" -ForegroundColor Red
    exit 1
}

# Check if native messaging host script exists
$hostScript = Join-Path $PSScriptRoot "native-messaging-host.js"
if (Test-Path $hostScript) {
    Write-Host "Native messaging host script found" -ForegroundColor Green
} else {
    Write-Host "Native messaging host script not found: $hostScript" -ForegroundColor Red
    exit 1
}

# Check if batch file exists
$batchFile = Join-Path $PSScriptRoot "native-messaging-host.bat"
if (Test-Path $batchFile) {
    Write-Host "Batch launcher found" -ForegroundColor Green
} else {
    Write-Host "Batch launcher not found: $batchFile" -ForegroundColor Red
    exit 1
}

# Check registry entries
Write-Host ""
Write-Host "Checking registry entries..." -ForegroundColor Cyan

$chromeReg = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager"
$edgeReg = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager"

if (Test-Path $chromeReg) {
    $chromePath = (Get-ItemProperty $chromeReg).'(default)'
    Write-Host "Chrome registry entry found: $chromePath" -ForegroundColor Green
    if (Test-Path $chromePath) {
        Write-Host "  Manifest file exists" -ForegroundColor Green
    } else {
        Write-Host "  Manifest file not found at path" -ForegroundColor Red
    }
} else {
    Write-Host "Chrome registry entry not found" -ForegroundColor Yellow
}

if (Test-Path $edgeReg) {
    $edgePath = (Get-ItemProperty $edgeReg).'(default)'
    Write-Host "Edge registry entry found: $edgePath" -ForegroundColor Green
    if (Test-Path $edgePath) {
        Write-Host "  Manifest file exists" -ForegroundColor Green
    } else {
        Write-Host "  Manifest file not found at path" -ForegroundColor Red
    }
} else {
    Write-Host "Edge registry entry not found" -ForegroundColor Yellow
}

# Check manifest content
$manifestPath = Join-Path $PSScriptRoot "com.cozy.downloadmanager.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host ""
    Write-Host "Manifest details:" -ForegroundColor Cyan
    Write-Host "  Name: $($manifest.name)" -ForegroundColor White
    Write-Host "  Path: $($manifest.path)" -ForegroundColor White
    Write-Host "  Allowed origins: $($manifest.allowed_origins -join ', ')" -ForegroundColor White
    
    if (Test-Path $manifest.path) {
        Write-Host "  Host executable exists" -ForegroundColor Green
    } else {
        Write-Host "  Host executable not found: $($manifest.path)" -ForegroundColor Red
    }
}

# Check if CDM is installed
Write-Host ""
Write-Host "Checking for CDM installation..." -ForegroundColor Cyan
$cdmPath = "C:\Program Files\Cozy Download Manager\Cozy Download Manager.exe"
if (Test-Path $cdmPath) {
    Write-Host "CDM found at: $cdmPath" -ForegroundColor Green
} else {
    Write-Host "CDM not found at: $cdmPath" -ForegroundColor Yellow
    Write-Host "  This is OK if running in development mode" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan

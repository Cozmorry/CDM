# Test the native messaging host directly
Write-Host "Testing native messaging host..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$hostScript = Join-Path $scriptDir "native-messaging-host.cmd"

if (-not (Test-Path $hostScript)) {
    Write-Host "ERROR: Host script not found: $hostScript" -ForegroundColor Red
    exit 1
}

Write-Host "Host script found: $hostScript" -ForegroundColor Green

# Test if Node.js can run the script
$nodeScript = Join-Path $scriptDir "native-messaging-host.js"
if (-not (Test-Path $nodeScript)) {
    Write-Host "ERROR: Node.js script not found: $nodeScript" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js script found: $nodeScript" -ForegroundColor Green

# Try to run Node.js directly
$nodePath = "C:\Program Files\nodejs\node.exe"
if (Test-Path $nodePath) {
    Write-Host "Testing Node.js execution..." -ForegroundColor Cyan
    $testResult = & $nodePath -e "console.log('Node.js works')" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js works!" -ForegroundColor Green
    } else {
        Write-Host "Node.js test failed: $testResult" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: Node.js not found at $nodePath" -ForegroundColor Yellow
    Write-Host "Trying 'node' from PATH..." -ForegroundColor Cyan
    $testResult = node -e "console.log('Node.js works')" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js works from PATH!" -ForegroundColor Green
    } else {
        Write-Host "Node.js not found in PATH: $testResult" -ForegroundColor Red
    }
}

Write-Host "`nManifest path check:" -ForegroundColor Cyan
$manifestPath = Join-Path $scriptDir "com.cozy.downloadmanager.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath | ConvertFrom-Json
    Write-Host "  Path in manifest: $($manifest.path)" -ForegroundColor Yellow
    $manifestHostPath = $manifest.path -replace '\\\\', '\'
    if (Test-Path $manifestHostPath) {
        Write-Host "  Manifest path exists: YES" -ForegroundColor Green
    } else {
        Write-Host "  Manifest path exists: NO" -ForegroundColor Red
        Write-Host "  Expected: $manifestHostPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Manifest not found!" -ForegroundColor Red
}


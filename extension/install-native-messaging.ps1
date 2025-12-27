# PowerShell script to install native messaging host for CDM extension
# Run this script as Administrator

$manifestPath = Join-Path $PSScriptRoot "com.cozy.downloadmanager.json"
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.cozy.downloadmanager"

# Get the actual path to the native messaging host script (use BAT to launch PowerShell silently)
$hostScriptPath = Join-Path $PSScriptRoot "native-messaging-host.bat"
$hostScriptPath = $hostScriptPath -replace '\\', '\\'

# Read and update the manifest
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$manifest.path = $hostScriptPath

# Save updated manifest
$manifest | ConvertTo-Json | Set-Content $manifestPath

# Create registry entry
New-Item -Path $registryPath -Force | Out-Null
Set-ItemProperty -Path $registryPath -Name "(default)" -Value $manifestPath -Type String

Write-Host "Native messaging host installed successfully!" -ForegroundColor Green
Write-Host "Registry path: $registryPath" -ForegroundColor Cyan
Write-Host "Manifest path: $manifestPath" -ForegroundColor Cyan

# Also install for Edge (Chromium)
$edgeRegistryPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.cozy.downloadmanager"
New-Item -Path $edgeRegistryPath -Force | Out-Null
Set-ItemProperty -Path $edgeRegistryPath -Name "(default)" -Value $manifestPath -Type String

Write-Host "Also installed for Microsoft Edge!" -ForegroundColor Green


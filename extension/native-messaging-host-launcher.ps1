# Native Messaging Host Launcher (PowerShell - Hidden Window)
# This script runs Node.js without showing any window while maintaining stdio
# Must use direct execution (not Start-Process) to maintain stdio for native messaging

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "native-messaging-host.js"

# Try to find Node.js
$nodePath = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodePath)) {
    $nodePath = "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    if (-not (Test-Path $nodePath)) {
        $nodePath = "node"
    }
}

# Change to script directory
Set-Location $scriptDir

# Directly execute Node.js to maintain stdio connection
# This will inherit stdin/stdout from Chrome, maintaining native messaging connection
& $nodePath $nodeScript

exit $LASTEXITCODE

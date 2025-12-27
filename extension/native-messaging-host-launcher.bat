@echo off
REM Native Messaging Host Launcher - Hidden Window
REM This uses PowerShell to run Node.js without showing a window

cd /d "%~dp0"

REM Try full path first
if exist "C:\Program Files\nodejs\node.exe" (
    REM Use PowerShell to launch Node.js hidden
    powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'native-messaging-host.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden -NoNewWindow -PassThru | Out-Null"
    REM Fallback: direct launch (might show window briefly)
    "C:\Program Files\nodejs\node.exe" "native-messaging-host.js"
) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    "%LOCALAPPDATA%\Programs\nodejs\node.exe" "native-messaging-host.js"
) else (
    REM Fallback to PATH
    node "native-messaging-host.js"
)


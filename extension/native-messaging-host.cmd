@echo off
REM Native Messaging Host Launcher for Windows
REM This runs Node.js without showing a window

cd /d "%~dp0"

REM Try to find node in common locations
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "native-messaging-host.js"
) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    "%LOCALAPPDATA%\Programs\nodejs\node.exe" "native-messaging-host.js"
) else (
    REM Fallback to PATH
    node "native-messaging-host.js"
)


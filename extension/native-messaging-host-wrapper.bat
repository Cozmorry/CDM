@echo off
REM Native Messaging Host Wrapper - Maintains stdio for native messaging
REM This is launched by the VBS script to maintain stdio connection

cd /d "%~dp0"

REM Try full path first
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "native-messaging-host.js"
) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    "%LOCALAPPDATA%\Programs\nodejs\node.exe" "native-messaging-host.js"
) else (
    REM Fallback to PATH
    node "native-messaging-host.js"
)


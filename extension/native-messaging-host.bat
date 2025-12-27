@echo off
REM Native Messaging Host Launcher - Minimal Window
REM Launches PowerShell script which runs Node.js

cd /d "%~dp0"

REM Launch PowerShell script with hidden window
REM Use -WindowStyle Hidden and -ExecutionPolicy Bypass
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "native-messaging-host-launcher.ps1"

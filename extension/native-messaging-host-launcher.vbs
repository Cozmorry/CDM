' Native Messaging Host Launcher (VBScript - Completely Hidden)
' This script launches a batch file that maintains stdio for native messaging

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batchFile = fso.BuildPath(scriptDir, "native-messaging-host-wrapper.bat")

' Change to script directory
WshShell.CurrentDirectory = scriptDir

' Launch batch file hidden (0 = hidden window, True = wait to maintain stdio)
' The batch file will maintain the stdio connection for native messaging
WshShell.Run """" & batchFile & """", 0, True

Set WshShell = Nothing
Set fso = Nothing


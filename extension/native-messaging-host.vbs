Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c cd /d """ & scriptDir & """ && node native-messaging-host.js", 0, False
Set WshShell = Nothing
Set fso = Nothing


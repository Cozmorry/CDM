# PowerShell build script that disables code signing
# This prevents the symbolic link error on Windows

$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run build



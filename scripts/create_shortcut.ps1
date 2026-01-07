param (
    [string]$TargetFile,
    [string]$ShortcutFile,
    [string]$IconFile,
    [string]$Description
)

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutFile)
$Shortcut.TargetPath = $TargetFile
$Shortcut.WorkingDirectory = Split-Path $TargetFile
$Shortcut.IconLocation = $IconFile
$Shortcut.Description = $Description
$Shortcut.Save()

Write-Host "Shortcut created at $ShortcutFile"

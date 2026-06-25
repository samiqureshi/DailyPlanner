$shortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Daily Task Planner.lnk'
$targetPath = Join-Path $PSScriptRoot 'run-planner.bat'
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle = 1
$shortcut.Save()

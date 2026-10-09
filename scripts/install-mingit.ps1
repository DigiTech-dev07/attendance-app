$gitDir = 'C:\Users\in728521\MinGit'
if (!(Test-Path $gitDir)) {
    New-Item -ItemType Directory -Path $gitDir -Force | Out-Null
}
$zipPath = 'C:\Users\in728521\MinGit.zip'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Write-Host "Downloading MinGit..."
Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip" -OutFile $zipPath

Write-Host "Extracting MinGit to $gitDir..."
Expand-Archive -Path $zipPath -DestinationPath $gitDir -Force
Remove-Item $zipPath -Force

$gitExe = Join-Path $gitDir "cmd\git.exe"
if (Test-Path $gitExe) {
    Write-Host "SUCCESS: MinGit installed!"
    & $gitExe --version
} else {
    Write-Host "FAILED to find git.exe"
}

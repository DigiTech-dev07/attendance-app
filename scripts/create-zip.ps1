$zipPath = 'C:\Users\in728521\Desktop\Attendance-booking-app.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$items = Get-ChildItem -Path . -Exclude 'node_modules', '.git', 'dist', '.env', '.env.local', '.vercel', '.system_generated' | Select-Object -ExpandProperty FullName
Compress-Archive -Path $items -DestinationPath $zipPath -Force
Write-Host "SUCCESS: $zipPath created"

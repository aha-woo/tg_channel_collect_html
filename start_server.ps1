# PowerShell 启动脚本
Write-Host "正在启动本地服务器..." -ForegroundColor Green
Write-Host "服务器地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
python -m http.server 8000


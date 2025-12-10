# PowerShell script to tail all Vercel logs with [GEN] prefix
# Usage: .\scripts\vercel-logs-all.ps1

Write-Host "🔍 Watching all Vercel generation logs..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Use vercel logs with filter
vercel logs --follow --since 1h 2>&1 | ForEach-Object {
    $line = $_
    if ($line -match '\[GEN\]') {
        Write-Host $line
    }
}

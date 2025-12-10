# PowerShell script to tail Vercel logs for AI Strategy generation
# Usage: .\scripts\vercel-logs-ai-strategy.ps1

Write-Host "🔍 Watching Vercel logs for AI Strategy generation..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Use vercel logs with filter
vercel logs --follow --since 1h 2>&1 | ForEach-Object {
    $line = $_
    if ($line -match '\[GEN\]' -or $line -match '/api/ai-strategy') {
        Write-Host $line
    }
}

# PowerShell script to tail Vercel logs for Custom Course generation
# Usage: .\scripts\vercel-logs-custom-course.ps1

Write-Host "🔍 Watching Vercel logs for Custom Course generation..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Use vercel logs with filter
vercel logs --follow --since 1h 2>&1 | ForEach-Object {
    $line = $_
    if ($line -match '\[GEN\]' -or $line -match '/api/custom-course') {
        Write-Host $line
    }
}

# scripts/vercel-logs-custom-course.ps1 - Filter logs for Custom Course generation
# Usage: .\scripts\vercel-logs-custom-course.ps1 [--follow]

param(
    [switch]$Follow = $false
)

Write-Host "Fetching Custom Course logs..." -ForegroundColor Cyan
Write-Host ""

# Get latest production deployment URL
$lsOutput = vercel ls 2>$null

if (-not $lsOutput) {
    Write-Host "Failed to get deployments. Make sure you are logged in: vercel login" -ForegroundColor Red
    exit 1
}

# Parse output to get first production deployment URL
$deploymentUrl = $lsOutput | Select-String -Pattern "https://.*vercel\.app" | Select-Object -First 1

if (-not $deploymentUrl) {
    Write-Host "No production deployment found" -ForegroundColor Red
    exit 1
}

$deploymentUrl = $deploymentUrl.Line.Trim()

Write-Host "Monitoring: $deploymentUrl" -ForegroundColor Green
Write-Host "Filter: Custom Course, [ERROR], [GEN]" -ForegroundColor Yellow
Write-Host ""

if ($Follow) {
    Write-Host "Following logs (Ctrl+C to stop)..." -ForegroundColor Cyan
    Write-Host ""
    
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "Custom Course|\[ERROR\]|\[GEN\]|Custom Course API|Generation failed|Error sending|Watchdog timeout|Background generation error" -Context 0,2
} else {
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "Custom Course|\[ERROR\]|\[GEN\]|Custom Course API|Generation failed|Error sending|Watchdog timeout|Background generation error" -Context 0,2
}

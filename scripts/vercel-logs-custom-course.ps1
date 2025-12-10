# scripts/vercel-logs-custom-course.ps1 - Filter logs for Custom Course generation
# Usage: .\scripts\vercel-logs-custom-course.ps1 [--follow]

param(
    [switch]$Follow = $false
)

Write-Host "Fetching Custom Course logs..." -ForegroundColor Cyan
Write-Host ""

# Try to use production domain first, fallback to latest deployment
$deploymentUrl = "https://www.avenqor.net"

# Test if domain is accessible (optional check)
# If domain not configured, get latest production deployment
$lsOutput = vercel ls 2>$null

if ($lsOutput) {
    # Try to find a successful production deployment
    $successDeployment = $lsOutput | Select-String -Pattern "Production" | Select-String -Pattern "Ready|Building" | Select-Object -First 1
    
    if (-not $successDeployment) {
        # Fallback: get latest deployment URL
        $tempUrl = $lsOutput | Select-String -Pattern "https://.*vercel\.app" | Select-Object -First 1
        if ($tempUrl) {
            Write-Host "Using latest deployment URL (domain may not be configured)" -ForegroundColor Yellow
            $deploymentUrl = $tempUrl.Line.Trim()
        }
    } else {
        # Extract URL from successful deployment line
        $urlMatch = $lsOutput | Select-String -Pattern "https://.*vercel\.app" | Select-Object -First 1
        if ($urlMatch) {
            $deploymentUrl = $urlMatch.Line.Trim()
        }
    }
}

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

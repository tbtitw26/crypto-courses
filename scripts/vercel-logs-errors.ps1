# scripts/vercel-logs-errors.ps1 - Show only errors from production
# Usage: .\scripts\vercel-logs-errors.ps1 [--follow]

param(
    [switch]$Follow = $false
)

Write-Host "🔍 Fetching error logs..." -ForegroundColor Cyan
Write-Host ""

# Get latest production deployment URL
$lsOutput = vercel ls 2>$null

if (-not $lsOutput) {
    Write-Host "❌ Failed to get deployments. Make sure you're logged in: vercel login" -ForegroundColor Red
    exit 1
}

# Parse output to get first production deployment URL
$deploymentUrl = $lsOutput | Select-String -Pattern "https://.*vercel\.app" | Select-Object -First 1

if (-not $deploymentUrl) {
    Write-Host "❌ No production deployment found" -ForegroundColor Red
    exit 1
}

$deploymentUrl = $deploymentUrl.Line.Trim()

Write-Host "✅ Monitoring errors: $deploymentUrl" -ForegroundColor Green
Write-Host ""

if ($Follow) {
    Write-Host "🔄 Following error logs (Ctrl+C to stop)..." -ForegroundColor Cyan
    Write-Host ""
    
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|exception|Exception" -Context 1,1
} else {
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|exception|Exception" -Context 1,1
}


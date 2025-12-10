# PowerShell script to tail Vercel logs for AI Strategy generation
# Usage: .\scripts\vercel-logs-ai-strategy.ps1 [--follow]

param(
    [switch]$Follow = $false
)

Write-Host "🔍 Fetching AI Strategy logs..." -ForegroundColor Cyan
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

Write-Host "✅ Monitoring: $deploymentUrl" -ForegroundColor Green
Write-Host "🔍 Filter: AI Strategy, [GEN], /api/ai-strategy" -ForegroundColor Yellow
Write-Host ""

if ($Follow) {
    Write-Host "🔄 Following logs (Ctrl+C to stop)..." -ForegroundColor Cyan
    Write-Host ""
    
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "AI Strategy|\[GEN\]|/api/ai-strategy|Strategy generation|strategy" -Context 0,2
} else {
    vercel logs $deploymentUrl 2>$null | Select-String -Pattern "AI Strategy|\[GEN\]|/api/ai-strategy|Strategy generation|strategy" -Context 0,2
}

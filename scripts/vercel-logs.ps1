# scripts/vercel-logs.ps1 - PowerShell script for viewing Vercel production logs
# Usage: .\scripts\vercel-logs.ps1 [--follow] [--filter "text"]

param(
    [switch]$Follow = $false,
    [string]$Filter = "",
    [int]$Limit = 100
)

Write-Host "🔍 Fetching latest production deployment..." -ForegroundColor Cyan

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
$deploymentId = $deploymentUrl -replace "https://", "" -replace "\.vercel\.app.*", ""

Write-Host "✅ Found production deployment:" -ForegroundColor Green
Write-Host "   URL: $deploymentUrl" -ForegroundColor Yellow
Write-Host "   ID: $deploymentId" -ForegroundColor Yellow
Write-Host ""

# Get runtime logs
Write-Host "📋 Fetching runtime logs..." -ForegroundColor Cyan
Write-Host ""

if ($Follow) {
    Write-Host "🔄 Following logs (Ctrl+C to stop)..." -ForegroundColor Cyan
    Write-Host ""
    
    if ($Filter) {
        # Follow logs with filter
        vercel logs $deploymentUrl --json 2>$null | ForEach-Object {
            $log = $_ | ConvertFrom-Json
            $logLine = "$($log.timestamp) [$($log.level)] $($log.message)"
            
            if ($logLine -match $Filter) {
                Write-Host $logLine
            }
        }
    } else {
        # Follow all logs
        vercel logs $deploymentUrl 2>$null
    }
} else {
    # Get recent logs
    if ($Filter) {
        vercel logs $deploymentUrl --json 2>$null | ForEach-Object {
            $log = $_ | ConvertFrom-Json
            $logLine = "$($log.timestamp) [$($log.level)] $($log.message)"
            
            if ($logLine -match $Filter) {
                Write-Host $logLine
            }
        }
    } else {
        vercel logs $deploymentUrl 2>$null
    }
}


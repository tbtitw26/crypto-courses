# PowerShell script to watch course generation logs in real-time
# Usage: .\scripts\watch-logs.ps1 or npm run logs:watch

$logFile = "logs/course-generation.log"

if (-not (Test-Path $logFile)) {
    Write-Host "Log file not found: $logFile" -ForegroundColor Yellow
    Write-Host "Waiting for log file to be created..." -ForegroundColor Yellow
    while (-not (Test-Path $logFile)) {
        Start-Sleep -Seconds 1
    }
}

Write-Host "`n📋 Watching course generation logs..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host ""

# Show last 20 lines first
if (Test-Path $logFile) {
    Get-Content $logFile -Tail 20 | ForEach-Object {
        if ($_ -match '\[ERROR\]') {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match '\[WARN\]') {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match '\[INFO\]') {
            Write-Host $_ -ForegroundColor Cyan
        } else {
            Write-Host $_
        }
    }
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor DarkGray
    Write-Host ""
}

# Watch for new lines
$lastSize = (Get-Item $logFile).Length
while ($true) {
    Start-Sleep -Milliseconds 500
    
    if (-not (Test-Path $logFile)) {
        continue
    }
    
    $currentSize = (Get-Item $logFile).Length
    
    if ($currentSize -gt $lastSize) {
        $stream = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $stream.Position = $lastSize
        $reader = New-Object System.IO.StreamReader($stream)
        
        while ($null -ne ($line = $reader.ReadLine())) {
            if ($line -match '\[ERROR\]') {
                Write-Host $line -ForegroundColor Red
            } elseif ($line -match '\[WARN\]') {
                Write-Host $line -ForegroundColor Yellow
            } elseif ($line -match '\[INFO\]') {
                Write-Host $line -ForegroundColor Cyan
            } elseif ($line -match '✅|🎉|📝|📄|🎨|📊|🌐|💾|📸') {
                Write-Host $line -ForegroundColor Green
            } else {
                Write-Host $line
            }
        }
        
        $reader.Close()
        $stream.Close()
        $lastSize = $currentSize
    }
}


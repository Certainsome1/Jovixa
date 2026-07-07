$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$logDir = Join-Path $root "logs"
$python = (Get-Command python.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Port {
    param([int]$Port)

    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Stop-Port {
    param([int]$Port)

    $processIds = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.OwningProcess -ne 0 } |
        Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

function Clear-FrontendCache {
    $nextDir = Join-Path $frontend ".next"
    if (Test-Path -LiteralPath $nextDir) {
        Remove-Item -LiteralPath $nextDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Test-FrontendHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -ne 200 -or $response.Content -notmatch "/_next/static/css/") {
            return $false
        }

        $cssPath = [regex]::Match($response.Content, 'href="([^"]+layout\.css[^"]*)"').Groups[1].Value
        if (-not $cssPath) {
            return $false
        }

        $cssResponse = Invoke-WebRequest -Uri "http://localhost:3000$cssPath" -UseBasicParsing -TimeoutSec 10
        return $cssResponse.StatusCode -eq 200 -and $cssResponse.Content.Length -gt 1000
    }
    catch {
        return $false
    }
}

function Start-Backend {
    if (Test-Port 8000) {
        Write-Host "Backend already running on http://127.0.0.1:8000"
        return
    }

    Write-Host "Starting FastAPI backend..."
    $backendLog = Join-Path $logDir "backend.log"
    $backendErr = Join-Path $logDir "backend.err.log"
    Start-Process $python `
        -WindowStyle Hidden `
        -WorkingDirectory $backend `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload") `
        -RedirectStandardOutput $backendLog `
        -RedirectStandardError $backendErr | Out-Null
}

function Start-Frontend {
    if (Test-Port 3000) {
        if (Test-FrontendHealth) {
            Write-Host "Frontend already running on http://localhost:3000"
            return
        }

        Write-Host "Restarting unhealthy frontend..."
        Stop-Port 3000
        Start-Sleep -Seconds 2
    }

    Clear-FrontendCache
    Write-Host "Starting Next.js frontend..."
    $frontendLog = Join-Path $logDir "frontend.log"
    $frontendErr = Join-Path $logDir "frontend.err.log"
    Start-Process $npm `
        -WindowStyle Hidden `
        -WorkingDirectory $frontend `
        -ArgumentList @("run", "dev") `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError $frontendErr | Out-Null
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $Port) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

Start-Backend
Start-Frontend

Write-Host "Waiting for app..."
$backendReady = Wait-ForPort -Port 8000 -TimeoutSeconds 30
$frontendReady = Wait-ForPort -Port 3000 -TimeoutSeconds 45

if (-not $backendReady) {
    Write-Warning "Backend did not start on port 8000. See logs\backend.log"
}

if (-not $frontendReady) {
    Write-Warning "Frontend did not start on port 3000. See logs\frontend.log"
    exit 1
}

Start-Process "http://localhost:3000"
Write-Host "AI Job Matcher opened at http://localhost:3000"

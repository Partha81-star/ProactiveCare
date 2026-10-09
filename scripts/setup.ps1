$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
foreach ($service in @('backend', 'ai_notification_service')) {
    $serviceRoot = Join-Path $projectRoot $service
    $python = Join-Path $serviceRoot '.venv/Scripts/python.exe'
    if (-not (Test-Path -LiteralPath $python)) {
        py -3.12 -m venv (Join-Path $serviceRoot '.venv')
        if ($LASTEXITCODE -ne 0) { throw 'Install Python 3.12 before running setup.' }
    }
    & $python -m pip install -r (Join-Path $serviceRoot 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed for $service" }
}
Push-Location (Join-Path $projectRoot 'mediconnect-ai')
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed' }
} finally { Pop-Location }
Write-Host 'Setup complete. Run: py -3.12 scripts/dev.py'

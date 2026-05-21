# RAVEN — Deploy to Cloudflare Pages (Windows)
# Run: powershell -ExecutionPolicy Bypass -File scripts/deploy-cloudflare.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "RAVEN → Cloudflare Pages (ahnuhad)" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed. Download: https://nodejs.org/" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "node_modules\wrangler")) {
  Write-Host "Installing wrangler..." -ForegroundColor Yellow
  npm install
}

Write-Host "Login (browser will open if needed)..." -ForegroundColor Yellow
npx wrangler whoami 2>$null
if ($LASTEXITCODE -ne 0) {
  npx wrangler login
}

Write-Host "Deploying to project: ahnuhad ..." -ForegroundColor Green
npx wrangler pages deploy . --project-name=ahnuhad

Write-Host ""
Write-Host "Done. Add env vars + RAVEN_KV in Cloudflare dashboard if not yet." -ForegroundColor Green
Write-Host "Guide: CLOUDFLARE-SETUP.md" -ForegroundColor Cyan

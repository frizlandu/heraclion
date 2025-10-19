<#
 Render deploy helper template (fill in the placeholders and run locally).
 This script does NOT call Render APIs; it prints suggested commands for manual use.

 Replace the <...> placeholders with real values before running.
#>

$backendUrl = "https://<your-backend>.onrender.com"
$frontendUrl = "https://<your-frontend>.vercel.app"

Write-Host "Backend health check: $backendUrl/api/health"
Write-Host "Frontend check: $frontendUrl"

Write-Host "`nRun these checks:`n"
Write-Host "Invoke-WebRequest -UseBasicParsing $backendUrl/api/health"
Write-Host "Invoke-WebRequest -UseBasicParsing $frontendUrl | Select-Object StatusCode"

Write-Host "`nIf you need to run migrations remotely from your machine (use with caution):`n"
Write-Host "# cd to backend and run migrate pointing to prod DB"
Write-Host "cd C:\path\to\repo\backend"
Write-Host "NODE_ENV=production DB_HOST=<db-host> DB_USER=<db-user> DB_PASSWORD=<db-password> npm run migrate"

Write-Host "`nRemember: Do not commit secrets. Use the Render UI to set env vars.`n"

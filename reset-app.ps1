# PowerShell script to reset Kinetic app local storage and user configurations for testing fresh setups.
Write-Host "--------------------------------------------------------" -ForegroundColor Purple
Write-Host " Wiping Kinetic local data directories... " -ForegroundColor Purple
Write-Host "--------------------------------------------------------" -ForegroundColor Purple

$dirs = @(
    "$env:APPDATA\kinetic",
    "$env:APPDATA\Kinetic Alpha",
    "$env:LOCALAPPDATA\kinetic-updater"
)

$wiped = $false

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "Removing: $dir" -ForegroundColor Yellow
        try {
            Remove-Item -Path $dir -Recurse -Force
            $wiped = $true
        } catch {
            Write-Host "Could not remove directory: $dir (Make sure Kinetic is closed first!)" -ForegroundColor Red
        }
    }
}

if ($wiped) {
    Write-Host "Kinetic local data has been successfully wiped!" -ForegroundColor Green
    Write-Host "The next time you open the app, it will trigger a fresh Setup Wizard." -ForegroundColor Green
} else {
    Write-Host "No active Kinetic user data directories found to delete." -ForegroundColor Cyan
}

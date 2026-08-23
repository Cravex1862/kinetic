$repo = "C:\Users\kalic\Ashwin\SaaS Video Demos"
$log = Join-Path $env:TEMP "kinetic-wip-commit.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    Push-Location $repo
    $dirty = & git status --porcelain
    if ($dirty) {
        & git add -A 2>&1 | Out-Null
        $commitMessage = "WIP checkpoint: $stamp"
        $output = & git commit -m $commitMessage 2>&1
        Add-Content -Path $log -Value "[$stamp] COMMITTED -> $output"
    }
    else {
        Add-Content -Path $log -Value "[$stamp] nothing to commit"
    }
}
catch {
    Add-Content -Path $log -Value "[$stamp] ERROR: $($_.Exception.Message)"
}
finally {
    Pop-Location
}

param(
    [Parameter(Mandatory=$true)] [String]$Environment
)
$DistFileLocation = "..\sfr\duality\screening-log\dist\duality.screening-log.bundle.js"

Write-Host "Building... " -NoNewline

Invoke-Expression -Command "npx webpack" | Out-Null

if($LASTEXITCODE -ne 0) {
    Write-Host "Failed!" -ForegroundColor Red
    exit
}
else {
    Write-Host "Succeeded" -ForegroundColor Green
}

try {
    Push-Location "..\..\..\_deploy-scripts"
    Invoke-Expression -Command ".\AddOrUpdateWidget.ps1 -Environment $Environment -WidgetFilename $DistFileLocation"
    Write-Host "Deploy succeeded." -ForegroundColor Green
}
catch {
    Write-Host "An error occurred:"
    Write-Host $_
}
finally {
    Pop-Location
}

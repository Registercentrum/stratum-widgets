param(
    [Parameter(Mandatory=$true)] [String]$Environment
)
$DistFileLocation = "dist\rrct.screening-log.bundle.js"
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
    Invoke-Expression -Command "..\..\..\_deploy-scripts\AddOrUpdateWidget.ps1 -Environment $Environment -WidgetFilename $DistFileLocation"
    Write-Host "Deploy succeeded." -ForegroundColor Green
}
catch {
    Write-Host "An error occurred:"
    Write-Host $_
}

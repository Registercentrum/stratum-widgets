param(
    [Parameter(Mandatory=$true)] [String]$Environment
)
$DistFileLocation = "hipsther.js"
try {
    Invoke-Expression -Command "..\..\..\..\_deploy-scripts\AddOrUpdateWidget.ps1 -Environment $Environment -WidgetFilename $DistFileLocation"
    Write-Host "Deploy succeeded." -ForegroundColor Green
}
catch {
    Write-Host "An error occurred:"
    Write-Host $_
}

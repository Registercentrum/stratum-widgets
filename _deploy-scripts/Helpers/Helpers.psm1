$Environment = ""
$ServerInstance = ""

function SetEnvironment {
  Param(
    [Parameter(Mandatory=$True)] [String]$Environment,
    [Parameter(Mandatory=$true)] [String]$ServerInstance
  )
  $script:Environment = $Environment
  $script:ServerInstance = $ServerInstance
}

function GetWidgetPageId {
  Param(
    [Parameter(Mandatory=$true)] [string]$WidgetId
  )
  return Get-ScalarValue -Query "SELECT TOP (1) PageID FROM cPages WHERE PageContent LIKE '<!-- Widget: $WidgetId -->%'" 
}

function Get-ScalarValue {
  Param(
    [Parameter(Mandatory=$True)] [String]$Query
  )
  $result = Invoke-Sqlcmd -Query $Query -ServerInstance $script:ServerInstance -Database 'Stratum'
  
  if(-not $result) {
    return $false
  }

  return $result.ItemArray[0]
}

function Backup-Widget {
  Param(
    [Parameter(Mandatory=$true)] [String]$WidgetId,
    [Parameter(Mandatory=$true)] [String]$WidgetName
  )
  Write-Host "Backing up widget: $WidgetName."
  $backupPath = Join-Path -Path $PSScriptRoot -ChildPath "..\_backup"
  $widgetContent = Get-ScalarValue -Query "SELECT PageContent FROM cPages WHERE PageContent LIKE '<!-- Widget: $WidgetId -->%'"
  $DateString = (Get-Date).toString("yyyy-MM-dd--HH_mm_ss")
  New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
  $widgetContent | Out-File -FilePath "$backupPath\$script:Environment-Widget--$WidgetName-$DateString.html"
}

function Backup-SubmitScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$FormId
  )
  Write-Host "Backing up submit script for form id: $FormId."
  $widgetContent = Get-ScalarValue -Query "SELECT SubmitScript FROM mForms WHERE FormID = $FormId"
  $dateString = (Get-Date).toString("yyyy-MM-dd--HH_mm_ss")
  $widgetContent | Out-File -FilePath "..\_backup\$script:Environment-SubmitScript--$FormId--$dateString.js"
}

function Backup-ControlScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$QuestionId
  )
  Write-Host "Backing up control script for question id: $QuestionId."
  $widgetContent = Get-ScalarValue -Query "SELECT ControlScript FROM mQuestions WHERE QuestionID = $QuestionId"
  $dateString = (Get-Date).toString("yyyy-MM-dd--HH_mm_ss")
  $widgetContent | Out-File -FilePath "..\_backup\$script:Environment-ControlScript--$QuestionId--$dateString.js"
}

function Backup-RegisterWidgetScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$RegisterId
  )
  Write-Host "Backing up register widget script for register id: $RegisterId."
  $widgetContent = Get-ScalarValue -Query "SELECT WidgetScript FROM mRegisters WHERE RegisterID = $RegisterId"
  $dateString = (Get-Date).toString("yyyy-MM-dd--HH_mm_ss")
  $widgetContent | Out-File -FilePath "..\_backup\$script:Environment-RegisterWidgetScript--$RegisterId--$dateString.js"
}

function UpdateSubmitScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$FormId,
    [Parameter(Mandatory=$true)] [string]$ScriptFileName
  )
  Backup-SubmitScript -FormId $FormId
  $scriptContent = [IO.File]::ReadAllText("$(Get-Location)\$ScriptFileName")
  $query = "UPDATE TOP (1) mForms SET SubmitScript = @SubmitScript WHERE FormID = @FormID"
  $sqlParameters = @{ 
      "SubmitScript" = $scriptContent;
      "FormID" = $FormId
  }
  Write-Host "Updating submit script: $ScriptFileName."
  Invoke-Sqlcmd2 -Query $query -SqlParameters $sqlParameters -ServerInstance $script:ServerInstance -Database 'Stratum'
}

function UpdateControlScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$QuestionId,
    [Parameter(Mandatory=$true)] [string]$ScriptFileName
  )
  Backup-ControlScript -QuestionId $QuestionId
  $scriptContent = [IO.File]::ReadAllText("$(Get-Location)\$ScriptFileName")
  $query = "UPDATE TOP (1) mQuestions SET ControlScript = @ControlScript WHERE QuestionID = @QuestionID"
  $sqlParameters = @{ 
      "ControlScript" = $scriptContent;
      "QuestionID" = $QuestionId
  }
  Write-Host "Updating control script: $ScriptFileName."
  Invoke-Sqlcmd2 -Query $query -SqlParameters $sqlParameters -ServerInstance $script:ServerInstance -Database 'Stratum'
}

function UpdateRegisterWidgetScript {
  Param(
    [Parameter(Mandatory=$true)] [int]$RegisterId,
    [Parameter(Mandatory=$true)] [string]$ScriptFileName
  )
  Backup-RegisterWidgetScript -RegisterId $RegisterId
  $scriptContent = [IO.File]::ReadAllText("$(Get-Location)\$ScriptFileName")
  $scriptContent = $scriptContent.replace("{ENVIRONMENT}", $Environment.ToLower())
  $query = "UPDATE TOP (1) mRegisters SET WidgetScript = @WidgetScript WHERE RegisterID = @RegisterID"
  $sqlParameters = @{ 
      "WidgetScript" = $scriptContent;
      "RegisterID" = $RegisterId
  }
  Write-Host "Updating register widget script: $ScriptFileName."
  Invoke-Sqlcmd2 -Query $query -SqlParameters $sqlParameters -ServerInstance $script:ServerInstance -Database 'Stratum'
}

function UpdateWidget {
  Param(
      [Parameter(Mandatory=$True)] [String]$WidgetId,
      [Parameter(Mandatory=$true)] [String]$WidgetName,
      [Parameter(Mandatory=$true)] [String]$PageContent,
      [Parameter(Mandatory=$true)] [int]$PageId
    )
  Backup-Widget -WidgetId $WidgetId -WidgetName $WidgetName
  $query = "UPDATE TOP (1) cPages SET PageContent = @PageContent WHERE PageID = @PageID"
  $sqlParameters = @{ 
      "PageContent" = $PageContent;
      "PageID" = $PageId
  }
  Write-Host "Updating widget: $WidgetName."
  Invoke-Sqlcmd2 -Query $query -SqlParameters $sqlParameters -ServerInstance $script:ServerInstance -Database 'Stratum'
}

function CreateWidget {
  Param(
      [Parameter(Mandatory=$True)] [String]$WidgetName,
      [Parameter(Mandatory=$true)] [String]$PageContent,
      [Parameter(Mandatory=$true)] [String]$SiteId
    )
  Write-Host "Creating new widget: $($WidgetName)..."
  $query = "INSERT INTO cPages (PageTitle, PageContent, PageLevel, PageOrder, PageScope, SiteID) VALUES (@WidgetName, @PageContent, 1, 9999, 0, @SiteID)"
  $sqlParameters = @{
      "WidgetName" = $WidgetName;
      "PageContent" = $PageContent;
      "SiteID" = $SiteId
  }
  Invoke-Sqlcmd2 -Query $query -SqlParameters $sqlParameters -ServerInstance $script:ServerInstance -Database 'Stratum'
}


Export-ModuleMember -Function AddOrUpdateWidget
Export-ModuleMember -Function UpdateSubmitScript
Export-ModuleMember -Function UpdateControlScript
Export-ModuleMember -Function UpdateRegisterWidgetScript
Export-ModuleMember -Function SetEnvironment
Export-ModuleMember -Function GetWidgetPageId
Export-ModuleMember -Function CreateWidget
Export-ModuleMember -Function UpdateWidget

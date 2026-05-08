$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$hadoopBin = Join-Path $PSScriptRoot "hadoop\bin"
New-Item -ItemType Directory -Force -Path $hadoopBin | Out-Null

$winutilsTarget = Join-Path $hadoopBin "winutils.exe"
$winutilsUrl = "https://raw.githubusercontent.com/cdarlint/winutils/master/hadoop-3.3.5/bin/winutils.exe"

if (Test-Path $winutilsTarget) {
    Write-Host "winutils.exe already exists: $winutilsTarget"
} else {
    Write-Host "Downloading winutils.exe..."
    Invoke-WebRequest -Uri $winutilsUrl -OutFile $winutilsTarget
    Write-Host "Downloaded: $winutilsTarget"
}

Write-Host ""
Write-Host "Local Spark Windows tools are ready."
Write-Host "HADOOP_HOME can be set to: $($PSScriptRoot)\hadoop"

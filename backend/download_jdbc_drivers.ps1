$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$jarsDir = Join-Path $PSScriptRoot "jars"
New-Item -ItemType Directory -Force -Path $jarsDir | Out-Null

$postgresVersion = "42.7.4"
$postgresJar = "postgresql-$postgresVersion.jar"
$postgresUrl = "https://jdbc.postgresql.org/download/$postgresJar"
$postgresTarget = Join-Path $jarsDir $postgresJar

if (Test-Path $postgresTarget) {
    Write-Host "PostgreSQL JDBC driver already exists: $postgresTarget"
} else {
    Write-Host "Downloading PostgreSQL JDBC driver..."
    Invoke-WebRequest -Uri $postgresUrl -OutFile $postgresTarget
    Write-Host "Downloaded: $postgresTarget"
}

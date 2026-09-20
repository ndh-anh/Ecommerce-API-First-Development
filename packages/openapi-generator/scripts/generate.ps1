param(
    [string]$OutputDir = "",
    [string]$CustomPath = ""
)

$ErrorActionPreference = "Stop"

# Get absolute paths for directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$GeneratorDir = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$RootDir = (Resolve-Path (Join-Path $GeneratorDir "..\..")).Path

if ([string]::IsNullOrEmpty($OutputDir)) {
    $OutputDir = Join-Path $RootDir "output"
}

$GeneratorJar = Join-Path $GeneratorDir "target\openapi-generator-1.0.0.jar"
$CliJar = Join-Path $GeneratorDir "lib\openapi-generator-cli.jar"

Write-Host "ROOT_DIR:       $RootDir"
Write-Host "GENERATOR_DIR:  $GeneratorDir"
Write-Host "GENERATOR_JAR:  $GeneratorJar"
Write-Host "CLI_JAR:        $CliJar"
Write-Host "OUTPUT_DIR:     $OutputDir"
if ([string]::IsNullOrEmpty($CustomPath)) {
    Write-Host "CUSTOM_PATH:    <not set>"
} else {
    Write-Host "CUSTOM_PATH:    $CustomPath"
}

# Download openapi-generator-cli if not exists
if (!(Test-Path -Path $CliJar -PathType Leaf)) {
    Write-Host "Downloading openapi-generator-cli..."
    $LibDir = Join-Path $GeneratorDir "lib"
    if (!(Test-Path $LibDir)) { New-Item -ItemType Directory -Path $LibDir -Force | Out-Null }
    Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/7.21.0/openapi-generator-cli-7.21.0.jar" -OutFile $CliJar
}

# Build jar if not exists
if (!(Test-Path -Path $GeneratorJar -PathType Leaf)) {
    Write-Host "Building generator jar..."
    Push-Location $GeneratorDir
    try {
        & mvn clean package -DskipTests
        if ($LASTEXITCODE -ne 0) { throw "Maven build failed. Make sure Maven (mvn) is installed and in your PATH." }
    } finally {
        Pop-Location
    }
}

if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$OpenApiDocsPath = Join-Path $RootDir "docs\openapi\*.json"
$JsonFiles = Get-ChildItem -Path $OpenApiDocsPath -File -ErrorAction SilentlyContinue

if ($null -eq $JsonFiles -or $JsonFiles.Count -eq 0) {
    Write-Host "No JSON files found in docs\openapi\"
    exit
}

foreach ($File in $JsonFiles) {
    $Name = $File.BaseName
    Write-Host "Generating: $Name"

    # Note: On Windows, the classpath separator is a semicolon (;) not a colon (:)
    $ClassPath = "$GeneratorJar;$CliJar"
    
    $GeneratedControllerPath = Join-Path $OutputDir "generated-controller"

    $JavaArgs = @(
        "-cp", $ClassPath,
        "-DgeneratedControllerPath=$GeneratedControllerPath"
    )

    if (-not [string]::IsNullOrEmpty($CustomPath)) {
        if (!(Test-Path $CustomPath)) { New-Item -ItemType Directory -Path $CustomPath -Force | Out-Null }
        $ResolvedCustomPath = (Resolve-Path $CustomPath).Path
        $JavaArgs += "-DcustomPath=$ResolvedCustomPath"
    }

    $TmpOutputDir = Join-Path $OutputDir "tmp\$Name"

    $JavaArgs += @(
        "org.openapitools.codegen.OpenAPIGenerator", "generate",
        "-g", "custom-generator",
        "--skip-validate-spec",
        "-i", $File.FullName,
        "-o", $TmpOutputDir
    )

    # Execute Java
    & java @JavaArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Java generation failed for $Name. Make sure Java is installed and in your PATH."
    }

    if (Test-Path $TmpOutputDir) {
        Remove-Item -Recurse -Force $TmpOutputDir
    }
}

Write-Host "Done!"


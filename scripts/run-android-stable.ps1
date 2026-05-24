param(
  [string]$AvdName = "Medium_Phone",
  [int]$BootTimeoutSeconds = 240
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

function Write-Step {
  param([string]$Message)
  Write-Host "[android-runner] $Message"
}

function Get-SdkRoot {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    return $env:ANDROID_HOME
  }

  if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    return $env:ANDROID_SDK_ROOT
  }

  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) {
    return $defaultSdk
  }

  throw "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT."
}

function Invoke-Adb {
  param(
    [string]$AdbPath,
    [string[]]$Arguments
  )

  return & $AdbPath @Arguments
}

function Get-AdbDeviceRows {
  param([string]$AdbPath)

  $rows = Invoke-Adb -AdbPath $AdbPath -Arguments @("devices")
  return $rows |
    Where-Object { $_ -match "\S" } |
    Where-Object { $_ -notmatch "daemon (not running|started successfully)" } |
    Select-Object -Skip 1
}

function Get-OnlineEmulatorSerial {
  param([string]$AdbPath)

  $deviceRow = Get-AdbDeviceRows -AdbPath $AdbPath |
    Where-Object { $_ -match "^emulator-\d+\s+device$" } |
    Select-Object -First 1

  if (-not $deviceRow) {
    return $null
  }

  return ($deviceRow -split "\s+")[0]
}

function Test-AvdExists {
  param(
    [string]$EmulatorPath,
    [string]$AvdName
  )

  $avds = & $EmulatorPath -list-avds
  return $avds -contains $AvdName
}

function Wait-ForBootCompleted {
  param(
    [string]$AdbPath,
    [string]$Serial,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $state = (Invoke-Adb -AdbPath $AdbPath -Arguments @("-s", $Serial, "get-state") | Out-String).Trim()
    if ($state -eq "device") {
      $boot = (Invoke-Adb -AdbPath $AdbPath -Arguments @("-s", $Serial, "shell", "getprop", "sys.boot_completed") | Out-String).Trim()
      if ($boot -eq "1") {
        return
      }
    }

    Start-Sleep -Seconds 5
  }

  throw "Timed out waiting for emulator '$Serial' to finish booting."
}

$sdkRoot = Get-SdkRoot
$adbPath = Join-Path $sdkRoot "platform-tools\adb.exe"
$emulatorPath = Join-Path $sdkRoot "emulator\emulator.exe"

if (-not (Test-Path $adbPath)) {
  throw "adb not found at $adbPath"
}

if (-not (Test-Path $emulatorPath)) {
  throw "Android emulator not found at $emulatorPath"
}

if (-not (Test-AvdExists -EmulatorPath $emulatorPath -AvdName $AvdName)) {
  throw "Android Virtual Device '$AvdName' does not exist. Check Android Studio Device Manager."
}

Write-Step "Restarting adb to clear stale offline sessions..."
Invoke-Adb -AdbPath $adbPath -Arguments @("kill-server") | Out-Null
Invoke-Adb -AdbPath $adbPath -Arguments @("start-server") | Out-Null

$offlineRows = Get-AdbDeviceRows -AdbPath $adbPath | Where-Object { $_ -match "^emulator-\d+\s+offline$" }
foreach ($row in $offlineRows) {
  $serial = ($row -split "\s+")[0]
  Write-Step "Removing stale offline emulator $serial..."
  Invoke-Adb -AdbPath $adbPath -Arguments @("-s", $serial, "emu", "kill") | Out-Null
}

$serial = Get-OnlineEmulatorSerial -AdbPath $adbPath

if (-not $serial) {
  Write-Step "Launching AVD '$AvdName' with a clean boot..."
  $stdoutLogPath = Join-Path $PSScriptRoot "emulator-launch.out.log"
  $stderrLogPath = Join-Path $PSScriptRoot "emulator-launch.err.log"
  foreach ($path in @($stdoutLogPath, $stderrLogPath)) {
    if (Test-Path $path) {
      Remove-Item -LiteralPath $path -Force
    }
  }

  $emulatorProcess = Start-Process `
    -FilePath $emulatorPath `
    -ArgumentList @("@$AvdName", "-no-snapshot", "-netdelay", "none", "-netspeed", "full") `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLogPath `
    -RedirectStandardError $stderrLogPath `
    -PassThru

  $deadline = (Get-Date).AddSeconds(120)
  while ((Get-Date) -lt $deadline -and -not $serial) {
    Start-Sleep -Seconds 5
    $serial = Get-OnlineEmulatorSerial -AdbPath $adbPath

    if ($emulatorProcess.HasExited) {
      $tail = ""
      $availableLogs = @($stdoutLogPath, $stderrLogPath) | Where-Object { Test-Path $_ }
      if ($availableLogs) {
        $tail = (Get-Content $availableLogs -Tail 20 | Out-String).Trim()
      }

      if ($tail) {
        throw "Emulator '$AvdName' exited before connecting to adb. See scripts/emulator-launch.err.log. Last output: $tail"
      }

      throw "Emulator '$AvdName' exited before connecting to adb."
    }
  }

  if (-not $serial) {
    throw "Emulator '$AvdName' did not appear in adb within 120 seconds. Check scripts/emulator-launch.err.log and Android Studio Device Manager."
  }
}
else {
  Write-Step "Reusing already connected emulator $serial..."
}

Write-Step "Waiting for Android boot to complete on $serial..."
Wait-ForBootCompleted -AdbPath $adbPath -Serial $serial -TimeoutSeconds $BootTimeoutSeconds

Write-Step "Installing app on $serial..."
& npx react-native run-android --deviceId $serial
if ($LASTEXITCODE -ne 0) {
  throw "react-native run-android failed with exit code $LASTEXITCODE"
}

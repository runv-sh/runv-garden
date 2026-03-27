Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Save-CroppedSprite {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$MinX,
    [int]$MinY,
    [int]$MaxX,
    [int]$MaxY,
    [string]$OutputPath,
    [int]$Padding = 3
  )

  $width = ($MaxX - $MinX + 1) + ($Padding * 2)
  $height = ($MaxY - $MinY + 1) + ($Padding * 2)
  $output = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $rect = New-Object System.Drawing.Rectangle($MinX, $MinY, ($MaxX - $MinX + 1), ($MaxY - $MinY + 1))
  $graphics.DrawImage($Bitmap, $Padding, $Padding, $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $output.Dispose()
}

function Get-ComponentBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$AlphaThreshold = 10,
    [switch]$TreatBlackAsTransparent
  )

  $visited = New-Object 'bool[,]' $Bitmap.Width, $Bitmap.Height
  $components = @()

  function Is-FilledPixel {
    param([int]$X, [int]$Y)
    $pixel = $Bitmap.GetPixel($X, $Y)
    if ($pixel.A -le $AlphaThreshold) {
      return $false
    }
    if ($TreatBlackAsTransparent -and $pixel.R -le 8 -and $pixel.G -le 8 -and $pixel.B -le 8) {
      return $false
    }
    return $true
  }

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      if ($visited[$x, $y] -or -not (Is-FilledPixel -X $x -Y $y)) {
        continue
      }

      $queue = New-Object System.Collections.Generic.Queue[object]
      $queue.Enqueue(@($x, $y))
      $visited[$x, $y] = $true

      $minX = $x
      $maxX = $x
      $minY = $y
      $maxY = $y
      $count = 0

      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $px = [int]$point[0]
        $py = [int]$point[1]
        $count++

        if ($px -lt $minX) { $minX = $px }
        if ($px -gt $maxX) { $maxX = $px }
        if ($py -lt $minY) { $minY = $py }
        if ($py -gt $maxY) { $maxY = $py }

        foreach ($offset in @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))) {
          $nx = $px + $offset[0]
          $ny = $py + $offset[1]
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $Bitmap.Width -or $ny -ge $Bitmap.Height) {
            continue
          }
          if ($visited[$nx, $ny]) {
            continue
          }
          if (-not (Is-FilledPixel -X $nx -Y $ny)) {
            continue
          }
          $visited[$nx, $ny] = $true
          $queue.Enqueue(@($nx, $ny))
        }
      }

      if ($count -ge 25) {
        $components += [PSCustomObject]@{
          MinX = $minX
          MinY = $minY
          MaxX = $maxX
          MaxY = $maxY
          Count = $count
        }
      }
    }
  }

  return $components | Sort-Object MinY, MinX
}

function Export-ConnectedSprites {
  param(
    [string]$InputPath,
    [string]$OutputDirectory,
    [string]$Prefix,
    [switch]$TreatBlackAsTransparent
  )

  Ensure-Directory -Path $OutputDirectory
  $bitmap = [System.Drawing.Bitmap]::FromFile($InputPath)
  try {
    $components = Get-ComponentBounds -Bitmap $bitmap -TreatBlackAsTransparent:$TreatBlackAsTransparent
    $index = 1
    foreach ($component in $components) {
      $outputPath = Join-Path $OutputDirectory ("{0}-{1:D2}.png" -f $Prefix, $index)
      Save-CroppedSprite -Bitmap $bitmap -MinX $component.MinX -MinY $component.MinY -MaxX $component.MaxX -MaxY $component.MaxY -OutputPath $outputPath
      $index++
    }
  }
  finally {
    $bitmap.Dispose()
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$downloads = Join-Path $repoRoot ".downloads"
$publicRoot = Join-Path $repoRoot "public\assets\plants"

Ensure-Directory -Path $publicRoot
Ensure-Directory -Path (Join-Path $publicRoot "parts\trees\bodies")
Ensure-Directory -Path (Join-Path $publicRoot "parts\flowers\blooms")
Ensure-Directory -Path (Join-Path $publicRoot "parts\flowers\leaves")
Ensure-Directory -Path (Join-Path $publicRoot "parts\cacti\bodies")
Ensure-Directory -Path (Join-Path $publicRoot "parts\bushes\bodies")
Ensure-Directory -Path (Join-Path $publicRoot "parts\mushrooms\bodies")
Ensure-Directory -Path (Join-Path $publicRoot "parts\special\ferns")
Ensure-Directory -Path (Join-Path $publicRoot "parts\special\veteran_rewards")
Ensure-Directory -Path (Join-Path $publicRoot "presets")

Export-ConnectedSprites -InputPath (Join-Path $downloads "iso_pines.png") -OutputDirectory (Join-Path $publicRoot "parts\trees\bodies") -Prefix "pine"
Export-ConnectedSprites -InputPath (Join-Path $downloads "desert_decorations.png") -OutputDirectory (Join-Path $publicRoot "parts\cacti\bodies") -Prefix "desert"
Export-ConnectedSprites -InputPath (Join-Path $downloads "iso_jungle_fern_2.png") -OutputDirectory (Join-Path $publicRoot "parts\special\ferns") -Prefix "fern"
Export-ConnectedSprites -InputPath (Join-Path $downloads "platshrooms.png") -OutputDirectory (Join-Path $publicRoot "parts\mushrooms\bodies") -Prefix "shroom" -TreatBlackAsTransparent
Export-ConnectedSprites -InputPath (Join-Path $downloads "kudzu_leaves_32x32.png") -OutputDirectory (Join-Path $publicRoot "parts\flowers\leaves") -Prefix "leaf"

Copy-Item (Join-Path $downloads "baum.png") (Join-Path $publicRoot "parts\special\veteran_rewards\world-tree.png") -Force
Copy-Item (Join-Path $downloads "snoopeths_crops\2px\*.png") (Join-Path $publicRoot "parts\flowers\blooms") -Force

Write-Output "Plant assets exported to $publicRoot"

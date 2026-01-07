# Script to create a multi-size .ico file from a PNG
Add-Type -AssemblyName System.Drawing

$inputPng = "build\icon.png"
$outputIco = "build\icon.ico"

# Load the source image
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $inputPng))

# Define the sizes needed for Windows icons
$sizes = @(16, 24, 32, 48, 64, 128, 256)

# Create resized images
$images = @()
foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    $graphics.Dispose()
    $images += $bitmap
}

# Create the ICO file manually
$ms = New-Object System.IO.MemoryStream

# ICO Header
$writer = New-Object System.IO.BinaryWriter($ms)
$writer.Write([Int16]0)  # Reserved
$writer.Write([Int16]1)  # Type: 1 = ICO
$writer.Write([Int16]$images.Count)  # Number of images

# Calculate offsets
$headerSize = 6 + ($images.Count * 16)
$currentOffset = $headerSize

# First pass: collect PNG data and write directory entries
$pngDataList = @()
foreach ($img in $images) {
    $pngStream = New-Object System.IO.MemoryStream
    $img.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngData = $pngStream.ToArray()
    $pngDataList += , $pngData
    $pngStream.Dispose()
    
    $width = if ($img.Width -ge 256) { 0 } else { $img.Width }
    $height = if ($img.Height -ge 256) { 0 } else { $img.Height }
    
    $writer.Write([Byte]$width)       # Width
    $writer.Write([Byte]$height)      # Height
    $writer.Write([Byte]0)            # Color palette
    $writer.Write([Byte]0)            # Reserved
    $writer.Write([Int16]1)           # Color planes
    $writer.Write([Int16]32)          # Bits per pixel
    $writer.Write([Int32]$pngData.Length)  # Size of image data
    $writer.Write([Int32]$currentOffset)   # Offset to image data
    
    $currentOffset += $pngData.Length
}

# Second pass: write image data
foreach ($pngData in $pngDataList) {
    $writer.Write($pngData)
}

# Save to file
$fileStream = [System.IO.File]::Create((Join-Path (Get-Location) $outputIco))
$ms.WriteTo($fileStream)
$fileStream.Close()
$ms.Close()

# Cleanup
foreach ($img in $images) { $img.Dispose() }
$sourceImage.Dispose()

Write-Host "Created $outputIco with $($sizes.Count) sizes: $($sizes -join ', ')"

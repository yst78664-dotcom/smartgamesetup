[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ua = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
$dir = 'C:\Users\Yeson\.openclaw\workspace\smartgaming-site\docs\images'

function Download-Image($url, $filename) {
    $path = Join-Path $dir $filename
    try {
        Invoke-WebRequest $url -Headers $ua -UseBasicParsing -OutFile $path
        $size = (Get-Item $path).Length
        Write-Host "OK: $filename ($size bytes) from $url"
    } catch {
        Write-Host "FAIL: $filename from $url - $_"
    }
}

# 1. Razer Huntsman Mini - official OG image from razer.com
Download-Image 'https://assets2.razerzone.com/images/razer-huntsman-mini/razer-huntsman-mini-2020-OGimg.jpg' 'razer-huntsman-mini.jpg'

# 2. Govee DreamView G1 - try Govee CDN
# First get the page to find product images
$govee1 = Invoke-WebRequest 'https://us.govee.com/products/govee-dreamview-g1-gaming-light-for-24-29-pcs' -Headers $ua -UseBasicParsing
$goveeImgs = [regex]::Matches($govee1.Content, 'https://cdn\.shopify\.com/s/files/[^"\s]+?\.(jpg|png|webp)')
Write-Host "=== Govee DreamView G1 images ==="
$goveeImgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

# 3. Govee Gaming Light Strip G1
$govee2 = Invoke-WebRequest 'https://us.govee.com/products/govee-gaming-light-strip-g1' -Headers $ua -UseBasicParsing
$goveeImgs2 = [regex]::Matches($govee2.Content, 'https://cdn\.shopify\.com/s/files/[^"\s]+?\.(jpg|png|webp)')
Write-Host "=== Govee Gaming Light Strip G1 images ==="
$goveeImgs2 | ForEach-Object { $_.Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

# 4. BenQ - try to find product images from their CDN
$benq = Invoke-WebRequest 'https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo.html' -Headers $ua -UseBasicParsing
$benqAll = [regex]::Matches($benq.Content, '(https?://[^"\s<>]+?\.(jpg|png|webp|jpeg))')
Write-Host "=== BenQ ScreenBar Halo all images ==="
$benqAll | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 20 | ForEach-Object { Write-Host $_ }

# Also try the buy page
$benqBuy = Invoke-WebRequest 'https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo/buy.html' -Headers $ua -UseBasicParsing
$benqBuyImgs = [regex]::Matches($benqBuy.Content, '(https?://[^"\s<>]+?\.(jpg|png|webp|jpeg))')
Write-Host "=== BenQ ScreenBar Halo BUY page ==="
$benqBuyImgs | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 20 | ForEach-Object { Write-Host $_ }

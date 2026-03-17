$dir = 'C:\Users\Yeson\.openclaw\workspace\smartgaming-site\docs\images'

function DL($url, $file) {
    $path = Join-Path $dir $file
    & curl.exe -s -L -o $path -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" $url 2>$null
    $s = (Get-Item $path -ErrorAction SilentlyContinue).Length
    if ($s -gt 5000) {
        Write-Host "OK: $file ($s bytes)"
        return $true
    } else {
        if (Test-Path $path) { Remove-Item $path -Force }
        Write-Host "FAIL: $file ($s bytes)"
        return $false
    }
}

# 1. Razer Huntsman Mini - already good (205KB from razer.com)
Write-Host "--- Razer Huntsman Mini (already downloaded) ---"

# 2. Logitech G PRO X - use the PRO X TKL gallery image (closest to G PRO X)
Write-Host "--- Logitech G PRO X ---"
DL 'https://resource.logitechg.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-tkl/gallery-2-pro-x-tkl-black-lightspeed-gaming-keyboard.png' 'logitech-g-pro-x.jpg'

# 3. BenQ ScreenBar Halo - already downloaded (22KB from benq.com)
Write-Host "--- BenQ ScreenBar Halo (already downloaded) ---"

# 4. BenQ ScreenBar - already downloaded
Write-Host "--- BenQ ScreenBar (already downloaded) ---"

# 5. Quntis RGB Pro+ - already downloaded (574KB from quntis.com)
Write-Host "--- Quntis RGB Pro+ (already downloaded) ---"

# 6. Govee DreamView G1 - hero and product images
Write-Host "--- Govee DreamView G1 ---"
# The Govee DreamView G1 Pro page has product images
DL 'https://cdn.shopify.com/s/files/1/0512/3489/8105/products/H5075.jpg' 'govee-dreamview-g1-product.jpg'
# For hero, use the gaming lights banner
DL 'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/750_470-Gaming_Lights.jpg' 'govee-dreamview-g1-hero.jpg'

# 7. Govee Gaming Light G1 (for the backlighting article)
Write-Host "--- Govee Gaming Light G1 ---"
# Try to find the actual G1 strip product image
$govee2Raw = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-gaming-light-strip-g1" 2>$null
$g1Imgs = [regex]::Matches($govee2Raw, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/products/[^"\s]+?\.(jpg|png|webp)')
Write-Host "G1 Strip product images:"
$g1Imgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }
# Try files with H66 pattern (Govee gaming strip model numbers)
$g1Files = [regex]::Matches($govee2Raw, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/files/(H66[^"\s]+?\.(jpg|png|webp))')
Write-Host "G1 Strip H66 files:"
$g1Files | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }

# Try downloading the G1 strip product image from Govee CDN
$govee3Raw = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-gaming-light-strip-g1.json" 2>$null
if ($govee3Raw.Length -gt 100) {
    $g1JsonImgs = [regex]::Matches($govee3Raw, '"src"\s*:\s*"(https://cdn\.shopify\.com[^"]+)"')
    Write-Host "G1 JSON images: $($g1JsonImgs.Count)"
    $g1JsonImgs | Select-Object -First 3 | ForEach-Object { Write-Host "  $($_.Groups[1].Value)" }
    if ($g1JsonImgs.Count -gt 0) {
        DL $g1JsonImgs[0].Groups[1].Value 'govee-gaming-light-g1.jpg'
    }
}

# 8. EZONTEQ Fantasy - search for product image
Write-Host "--- EZONTEQ Fantasy ---"
# Try Amazon CDN for EZONTEQ
$amzEzon = & curl.exe -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://www.amazon.com/dp/B0C4PGG1BL" 2>$null
$ezonImgs = [regex]::Matches($amzEzon, 'https://m\.media-amazon\.com/images/I/[^"\s]+?\.(jpg|png)')
Write-Host "EZONTEQ Amazon images: $($ezonImgs.Count)"
$ezonImgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }

# 9. Fiotura G100
Write-Host "--- Fiotura G100 ---"
$amzFio = & curl.exe -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://www.amazon.com/dp/B0CDRX9L44" 2>$null
$fioImgs = [regex]::Matches($amzFio, 'https://m\.media-amazon\.com/images/I/[^"\s]+?\.(jpg|png)')
Write-Host "Fiotura Amazon images: $($fioImgs.Count)"
$fioImgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }

# 10. Actoridae Gaming Strip
Write-Host "--- Actoridae Gaming Strip ---"
$amzAct = & curl.exe -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://www.amazon.com/dp/B0BQQRKHVQ" 2>$null
$actImgs = [regex]::Matches($amzAct, 'https://m\.media-amazon\.com/images/I/[^"\s]+?\.(jpg|png)')
Write-Host "Actoridae Amazon images: $($actImgs.Count)"
$actImgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }

# 11. Gaming monitor ambient backlight hero (generic but relevant)
Write-Host "--- Gaming monitor backlight hero ---"
# Use the Govee gaming lights banner
DL 'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/3840_1440-Gaming_Lights.jpg' 'gaming-monitor-ambient-backlight-setup.jpg'

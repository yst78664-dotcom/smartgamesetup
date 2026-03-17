$dir = 'C:\Users\Yeson\.openclaw\workspace\smartgaming-site\docs\images'

function DL($url, $file) {
    $path = Join-Path $dir $file
    & curl.exe -s -L -o $path -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept: image/*,*/*" $url 2>$null
    $s = (Get-Item $path -ErrorAction SilentlyContinue).Length
    if ($s -gt 5000) {
        Write-Host "OK: $file ($s bytes)"
        return $true
    } else {
        if (Test-Path $path) { Remove-Item $path -Force }
        Write-Host "FAIL: $file from $url"
        return $false
    }
}

# BenQ ScreenBar Halo - Scene7 with explicit format
DL 'https://image.benq.com/is/image/benqco/together45?wid=800&fmt=jpg&qlt=85' 'benq-screenbar-halo.jpg'

# BenQ ScreenBar - find proper image ID
$benqHtml2 = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://www.benq.com/en-us/lighting/monitor-light/screenbar.html" 2>$null
$benqImgIds = [regex]::Matches($benqHtml2, 'image\.benq\.com/is/image/benqco/([a-zA-Z0-9_-]+)')
Write-Host "BenQ ScreenBar image IDs:"
$benqImgIds | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 15 | ForEach-Object { Write-Host "  $_" }

# Try the first non-tiny image
$benqSbIds = $benqImgIds | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
foreach ($id in $benqSbIds) {
    if ($id -notmatch '96x96|icon') {
        $ok = DL "https://image.benq.com/is/image/benqco/$($id)?wid=800&fmt=jpg&qlt=85" 'benq-screenbar.jpg'
        if ($ok) { Write-Host "  Used BenQ ID: $id"; break }
    }
}

# Logitech - try fetching product page with curl
$logiHtml = & curl.exe -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "https://www.logitechg.com/en-us/products/gaming-keyboards/pro-x-tkl-wireless-keyboard.920-012117.html" 2>$null
Write-Host "Logitech page size: $($logiHtml.Length)"
$logiImgs = [regex]::Matches($logiHtml, '(https?://resource\.logitechg\.com/[^"\s]+?\.(jpg|png|webp))')
Write-Host "Logitech resource URLs:"
$logiImgs | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host "  $_" }

# Also try old G PRO Keyboard URL
$logiHtml2 = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://www.logitechg.com/en-us/products/gaming-keyboards/pro-mechanical-gaming-keyboard.html" 2>$null
Write-Host "Logitech PRO page size: $($logiHtml2.Length)"
$logiImgs2 = [regex]::Matches($logiHtml2, '(https?://resource\.logitechg\.com/[^"\s]+)')
$logiImgs2 | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match '\.(jpg|png|webp)' } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host "  $_" }

# Govee - check raw page for product image patterns
$goveeRaw = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-dreamview-g1-pro-gaming-light" 2>$null
$goveeProductImgs = [regex]::Matches($goveeRaw, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/products/[^"\s]+?\.(jpg|png|webp)')
Write-Host "Govee DreamView product images: $($goveeProductImgs.Count)"
$goveeProductImgs | ForEach-Object { $_.Value } | Select-Object -Unique -First 5 | ForEach-Object { Write-Host "  $_" }

# Also search for /files/ pattern
$goveeFileImgs = [regex]::Matches($goveeRaw, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/files/[^"\s]+?\.(jpg|png|webp)')
Write-Host "Govee DreamView file images: $($goveeFileImgs.Count)"
$goveeFileImgs | ForEach-Object { $_.Value } | Select-Object -Unique | Where-Object { $_ -notmatch 'Shipping|Money|icon|logo|badge' } | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }

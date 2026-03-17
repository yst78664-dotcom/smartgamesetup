[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dir = 'C:\Users\Yeson\.openclaw\workspace\smartgaming-site\docs\images'

function DL($url, $file) {
    $path = Join-Path $dir $file
    try {
        & curl.exe -s -L -o $path -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" $url 2>$null
        $s = (Get-Item $path).Length
        if ($s -gt 5000) {
            Write-Host "OK: $file ($s bytes)"
            return $true
        } else {
            Write-Host "TOO SMALL: $file ($s bytes)"
            Remove-Item $path -Force
            return $false
        }
    } catch {
        Write-Host "FAIL: $file"
        return $false
    }
}

# Govee products - use Shopify JSON API
Write-Host "=== Govee DreamView G1 via Shopify JSON ==="
$json1 = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-dreamview-g1-gaming-light-for-24-29-pcs.json" 2>$null
$json1 | Out-File "$dir\..\govee-g1.json" -Encoding utf8
$imgs1 = [regex]::Matches($json1, '"src"\s*:\s*"(https://cdn\.shopify\.com/s/files[^"]+)"')
Write-Host "Found $($imgs1.Count) images"
$imgs1 | Select-Object -First 5 | ForEach-Object { Write-Host $_.Groups[1].Value }

Write-Host "=== Govee Gaming Light Strip G1 via Shopify JSON ==="
$json2 = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-gaming-light-strip-g1.json" 2>$null
$imgs2 = [regex]::Matches($json2, '"src"\s*:\s*"(https://cdn\.shopify\.com/s/files[^"]+)"')
Write-Host "Found $($imgs2.Count) images"
$imgs2 | Select-Object -First 5 | ForEach-Object { Write-Host $_.Groups[1].Value }

# Logitech - try different CDN patterns
Write-Host "=== Logitech G PRO X ==="
$logUrls = @(
    'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-keyboard/pro-x-702.png',
    'https://resource.logitechg.com/w_386,ar_1.0,c_limit,f_auto,q_auto,e_sharpen:60,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-keyboard/pro-x-702.png'
)
foreach ($u in $logUrls) { DL $u 'logitech-g-pro-x.png' }

# BenQ - try image CDN with DAM 
Write-Host "=== BenQ ==="
$benqUrls = @(
    'https://image.benq.com/is/image/benqco/01-screenbar-halo-702',
    'https://image.benq.com/is/image/benqco/screenbar-halo-702',
    'https://image.benq.com/is/image/benqco/screenbar-702',
    'https://image.benq.com/is/image/benqco/01-screenbar-702'
)
foreach ($u in $benqUrls) { 
    $ok = DL "$u`?$wid=800&fmt=png" 'benq-test.jpg'
    if ($ok) { Write-Host "  URL: $u"; break }
}

# Try fetching BenQ page with curl to find image URLs
$benqHtml = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo.html" 2>$null
$benqImgs = [regex]::Matches($benqHtml, '(https?://image\.benq\.com/[^"\s]+)')
Write-Host "BenQ image CDN URLs found: $($benqImgs.Count)"
$benqImgs | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

$benqImgs2 = [regex]::Matches($benqHtml, '(https?://[^"\s]+\.(jpg|png|webp))')
Write-Host "BenQ all image URLs:"
$benqImgs2 | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

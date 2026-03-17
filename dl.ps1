[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dir = 'C:\Users\Yeson\.openclaw\workspace\smartgaming-site\docs\images'
$ua = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

function DL($url, $file) {
    $path = Join-Path $dir $file
    try {
        Invoke-WebRequest $url -Headers $ua -UseBasicParsing -OutFile $path -TimeoutSec 15
        $s = (Get-Item $path).Length
        if ($s -gt 5000) {
            Write-Host "OK: $file ($s bytes)"
            return $true
        } else {
            Write-Host "TOO SMALL: $file ($s bytes) - probably error page"
            Remove-Item $path -Force
            return $false
        }
    } catch {
        Write-Host "FAIL: $file - $($_.Exception.Message)"
        return $false
    }
}

# === 1. Razer Huntsman Mini (already downloaded above, but re-confirm) ===
DL 'https://assets2.razerzone.com/images/razer-huntsman-mini/razer-huntsman-mini-2020-OGimg.jpg' 'razer-huntsman-mini.jpg'

# === 2. Logitech G PRO X keyboard - try logitechg CDN ===
# Known Logitech G PRO X image patterns
$logitechUrls = @(
    'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-keyboard/pro-keyboard-gallery-1.png',
    'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-keyboard/pro-x-702.png',
    'https://resource.logitechg.com/content/dam/gaming/en/products/pro-keyboard/pro-keyboard-gallery-1.png'
)
$ok = $false
foreach ($u in $logitechUrls) {
    if (-not $ok) { $ok = DL $u 'logitech-g-pro-x.jpg' }
}
if (-not $ok) {
    # Try fetching from Logitech CDN with different patterns
    Write-Host "Trying alternate Logitech sources..."
    DL 'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-keyboard/pro-x-702.png' 'logitech-g-pro-x.jpg'
}

# === 3. BenQ ScreenBar Halo ===
$benqHaloUrls = @(
    'https://www.benq.com/content/dam/b2c/en-us/lighting/monitor-light/screenbar-halo/screenbar-halo-main.png',
    'https://image.benq.com/is/image/benqco/screenbar-halo-main',
    'https://www.benq.com/content/dam/b2c/lighting/monitor-light/screenbar-halo/screenbar-halo.png'
)
$ok = $false
foreach ($u in $benqHaloUrls) {
    if (-not $ok) { $ok = DL $u 'benq-screenbar-halo.jpg' }
}

# === 4. BenQ ScreenBar original ===
$benqUrls = @(
    'https://www.benq.com/content/dam/b2c/en-us/lighting/monitor-light/screenbar/screenbar-main.png',
    'https://image.benq.com/is/image/benqco/screenbar-main'
)
$ok = $false
foreach ($u in $benqUrls) {
    if (-not $ok) { $ok = DL $u 'benq-screenbar.jpg' }
}

# === 5. Quntis RGB Pro+ ===
DL 'https://cdn.shopify.com/s/files/1/0151/6932/3072/files/20251125-162341.jpg' 'quntis-rgb-pro-plus.jpg'

# === 6. Govee DreamView G1 - try Govee CDN patterns ===
# Try fetching the Govee product page with curl
Write-Host "=== Fetching Govee pages with curl ==="
$goveeHtml = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-dreamview-g1-gaming-light-for-24-29-pcs" 2>$null
$goveeMatches = [regex]::Matches($goveeHtml, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/[^"\s]+?\.(jpg|png|webp)')
Write-Host "Govee DreamView G1 CDN images found: $($goveeMatches.Count)"
$goveeMatches | ForEach-Object { $_.Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

# Try Govee Gaming Light Strip G1
$govee2Html = & curl.exe -s -L -H "User-Agent: Mozilla/5.0" "https://us.govee.com/products/govee-gaming-light-strip-g1" 2>$null
$govee2Matches = [regex]::Matches($govee2Html, 'https://cdn\.shopify\.com/s/files/1/0512/3489/8105/[^"\s]+?\.(jpg|png|webp)')
Write-Host "Govee Gaming Light G1 CDN images found: $($govee2Matches.Count)"
$govee2Matches | ForEach-Object { $_.Value } | Select-Object -Unique -First 10 | ForEach-Object { Write-Host $_ }

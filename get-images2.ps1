[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function Get-ImageUrls($url, $label) {
    Write-Host "=== $label ==="
    try {
        $r = Invoke-WebRequest $url -Headers @{'User-Agent'=$ua} -UseBasicParsing -MaximumRedirection 5
        # Look for ALL image patterns including srcset, data-src, og:image
        $patterns = @(
            'https://[^"\s<>]+?\.(jpg|png|webp|jpeg)',
            'content="(https://[^"]+\.(jpg|png|webp|jpeg))"'
        )
        foreach ($p in $patterns) {
            $m = [regex]::Matches($r.Content, $p)
            $m | ForEach-Object { $_.Value } | Select-Object -Unique | ForEach-Object { Write-Host $_ }
        }
    } catch {
        Write-Host "ERROR: $_"
    }
}

# Try Razer press/product images - direct asset URLs
Write-Host "=== TRYING DIRECT RAZER ASSETS ==="
$razerUrls = @(
    'https://assets2.razerzone.com/images/razer-huntsman-mini/razer-huntsman-mini-2020-OGimg.jpg',
    'https://assets2.razerzone.com/images/pnx.assets/618ccfb0bf8f0cf27f3e83bf15e7b8d6/razer-huntsman-mini-2020-hero.jpg'
)
foreach ($u in $razerUrls) {
    try {
        $r = Invoke-WebRequest $u -Headers @{'User-Agent'=$ua} -UseBasicParsing -Method Head
        Write-Host "OK ($($r.StatusCode)): $u"
    } catch {
        Write-Host "FAIL: $u"
    }
}

# Try fetching Quntis page
Get-ImageUrls 'https://www.quntis.com/products/quntis-rgb-pro-monitor-light-bar-with-remote-15-modes-gaming-backlight-4-colors-brightness-dimmable-fronlight-20-ra95-eye-care-monitor-lamp-no-screen-glare-upgraded-clip-for-all-monitor' 'QUNTIS RGB PRO+'

# Try Logitech with different URL
Get-ImageUrls 'https://www.logitechg.com/en-us/products/gaming-keyboards/pro-x-tkl-wireless-keyboard.920-012117.html' 'LOGITECH G PRO X TKL'

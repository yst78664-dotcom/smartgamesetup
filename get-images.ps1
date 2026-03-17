[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function Get-ImageUrls($url, $label) {
    Write-Host "=== $label ==="
    try {
        $r = Invoke-WebRequest $url -Headers @{'User-Agent'=$ua} -UseBasicParsing
        $m = [regex]::Matches($r.Content, 'https://[^"\s<>]+?\.(jpg|png|webp)')
        $m | ForEach-Object { $_.Value } | Select-Object -Unique -First 20 | ForEach-Object { Write-Host $_ }
    } catch {
        Write-Host "ERROR: $_"
    }
}

Get-ImageUrls 'https://www.razer.com/gaming-keyboards/razer-huntsman-mini' 'RAZER HUNTSMAN MINI'
Get-ImageUrls 'https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo.html' 'BENQ SCREENBAR HALO'
Get-ImageUrls 'https://www.benq.com/en-us/lighting/monitor-light/screenbar.html' 'BENQ SCREENBAR'
Get-ImageUrls 'https://us.govee.com/products/govee-dreamview-g1-pro-gaming-light' 'GOVEE DREAMVIEW G1'
Get-ImageUrls 'https://us.govee.com/products/govee-gaming-light-strip-g1' 'GOVEE GAMING LIGHT G1'
Get-ImageUrls 'https://www.logitechg.com/en-us/products/gaming-keyboards/pro-x-tkl-wireless-keyboard.html' 'LOGITECH G PRO X'

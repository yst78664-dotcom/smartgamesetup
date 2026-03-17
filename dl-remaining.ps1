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
        Write-Host "FAIL: $file ($s bytes) from $url"
        return $false
    }
}

# Logitech - try without the d_transparent.gif fallback, use w_1000 for bigger image
Write-Host "--- Logitech G PRO X ---"
$logUrls = @(
    'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/content/dam/gaming/en/products/pro-x-tkl/gallery-2-pro-x-tkl-black-lightspeed-gaming-keyboard.png',
    'https://resource.logitechg.com/content/dam/gaming/en/products/pro-x-tkl/gallery-2-pro-x-tkl-black-lightspeed-gaming-keyboard.png',
    'https://resource.logitechg.com/content/dam/gaming/en/products/pro-keyboard/pro-clicky-gallery-1.png',
    'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/content/dam/gaming/en/products/pro-keyboard/pro-clicky-gallery-1.png'
)
foreach ($u in $logUrls) {
    $ok = DL $u 'logitech-g-pro-x.jpg'
    if ($ok) { break }
}

# Govee Gaming Light G1
Write-Host "--- Govee Gaming Light G1 ---"
DL 'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/H66A1-PP_d43de018-3ecc-40ef-ae92-e506406f9a3e.jpg' 'govee-gaming-light-g1.jpg'

# For EZONTEQ, Fiotura, Actoridae - try searching for their product images
# EZONTEQ Fantasy - try product image from various sources
Write-Host "--- EZONTEQ Fantasy ---"
$ezonUrls = @(
    'https://m.media-amazon.com/images/I/71kR4qBRxvL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81Qz+Z5HKWL._AC_SL1500_.jpg'
)
foreach ($u in $ezonUrls) {
    $ok = DL $u 'ezonteq-fantasy.jpg'
    if ($ok) { break }
}

# Fiotura G100
Write-Host "--- Fiotura G100 ---"
$fioUrls = @(
    'https://m.media-amazon.com/images/I/71xKqPOYJYL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/61kSqPOYJYL._AC_SL1500_.jpg'
)
foreach ($u in $fioUrls) {
    $ok = DL $u 'fiotura-g100.jpg'
    if ($ok) { break }
}

# Actoridae Gaming Strip
Write-Host "--- Actoridae Gaming Strip ---"
$actUrls = @(
    'https://m.media-amazon.com/images/I/71aMqG6OKWL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81aMqG6OKWL._AC_SL1500_.jpg'
)
foreach ($u in $actUrls) {
    $ok = DL $u 'actoridae-gaming-strip.jpg'
    if ($ok) { break }
}

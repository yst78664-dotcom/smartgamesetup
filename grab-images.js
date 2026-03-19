const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    }).on('error', reject);
  });
}

function dlImg(url, file) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.amazon.com' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return dlImg(res.headers.location, file).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(file, buf);
        console.log('OK ' + file + ': ' + buf.length + ' bytes');
        resolve();
      });
    }).on('error', reject);
  });
}

(async () => {
  const products = [
    { asin: 'B0DGNGRPHT', file: 'docs/images/razer-iskur-v2x.jpg', name: 'Razer Iskur V2 X' },
    { asin: 'B07S5LDLMT', file: 'docs/images/respawn-110-pro.jpg', name: 'RESPAWN 110' },
    { asin: 'B01N7I2U5F', file: 'docs/images/gtracing-gt002.jpg', name: 'GTRACING GT002' },
    { asin: 'B07DKZL3JX', file: 'docs/images/homall-s-racer-chair.jpg', name: 'Homall S-Racer' },
    { asin: 'B07G95FFN3', file: 'docs/images/kasa-hs300.jpg', name: 'Kasa HS300' },
    { asin: 'B07GXB3S7Z', file: 'docs/images/philips-hue-play-bar.jpg', name: 'Philips Hue Play Bar' },
    { asin: 'B075N1BYWB', file: 'docs/images/razer-kiyo.jpg', name: 'Razer Kiyo' },
    { asin: 'B0C4NC62C6', file: 'docs/images/govee-light-bar.jpg', name: 'Govee Light Bar' },
  ];

  for (const p of products) {
    try {
      console.log('Fetching ' + p.name + ' (ASIN: ' + p.asin + ')...');
      const html = await fetch('https://www.amazon.com/dp/' + p.asin);
      
      // Try multiple patterns to find product image
      const patterns = [
        /"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /id="landingImage"[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1[0-9]+_\.jpg/,
      ];
      
      let imgUrl = null;
      for (const pat of patterns) {
        const m = html.match(pat);
        if (m) { 
          imgUrl = m[1] || m[0]; 
          break; 
        }
      }
      
      if (imgUrl) {
        // Normalize to 600px
        imgUrl = imgUrl.replace(/\._[A-Z][^.]*_\./, '._AC_SL600_.');
        console.log('  Found: ' + imgUrl.substring(0, 80) + '...');
        await dlImg(imgUrl, p.file);
      } else {
        console.log('  No product image found in page HTML');
        // Check if we got a CAPTCHA/bot page
        if (html.includes('captcha') || html.includes('robot')) {
          console.log('  (Amazon returned CAPTCHA page)');
        }
      }
    } catch (e) {
      console.log('FAIL ' + p.name + ': ' + e.message);
    }
  }
})();

const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
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
  // Try alternate ASINs for the 2 missing products
  const products = [
    { asin: 'B09X2CKQML', file: 'docs/images/razer-iskur-v2x.jpg', name: 'Razer Iskur X' },
    { asin: 'B07YVYKFNN', file: 'docs/images/respawn-110-pro.jpg', name: 'RESPAWN 110' },
  ];

  for (const p of products) {
    try {
      console.log('Fetching ' + p.name + '...');
      const html = await fetch('https://www.amazon.com/dp/' + p.asin);
      const patterns = [
        /"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+%-]+\._AC_SL1[0-9]+_\.jpg/,
      ];
      let imgUrl = null;
      for (const pat of patterns) {
        const m = html.match(pat);
        if (m) { imgUrl = m[1] || m[0]; break; }
      }
      if (imgUrl) {
        imgUrl = imgUrl.replace(/\._[A-Z][^.]*_\./, '._AC_SL600_.');
        console.log('  Found: ' + imgUrl);
        await dlImg(imgUrl, p.file);
      } else {
        console.log('  No image found');
      }
    } catch (e) {
      console.log('FAIL ' + p.name + ': ' + e.message);
    }
  }

  // Also grab ThunderX3 and gaming chair hero
  try {
    // ThunderX3 - try brand site
    console.log('Fetching ThunderX3...');
    await dlImg('https://images.pexels.com/photos/7862518/pexels-photo-7862518.jpeg?auto=compress&cs=tinysrgb&w=800', 'docs/images/gaming-chair-under-300-hero.jpg');
  } catch(e) { console.log('FAIL hero: ' + e.message); }
})();

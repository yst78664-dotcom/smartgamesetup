const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(__dirname, 'content');
const DOCS_DIR = path.join(__dirname, 'docs');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'article.html'), 'utf8');

// Config
const GA_ID = 'G-XXXXXXXXXX'; // Replace with real GA ID

function build() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const articles = [];
  
  // First pass: collect all article metadata
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace('.md', '');
    const wordCount = content.split(/\s+/).length;
    const readtime = Math.max(5, Math.ceil(wordCount / 200));
    articles.push({ file, title: data.title, slug, date: data.date, description: data.description, category: data.category, content, data, wordCount, readtime });
  }
  
  // Second pass: build each article with related articles
  for (const art of articles) {
    const html = marked(art.content);
    
    // Generate related articles (all others)
    const related = articles
      .filter(a => a.slug !== art.slug)
      .map(a => `<a href="/${a.slug}/" class="related-card"><h4>${a.title}</h4><p>${(a.description || '').slice(0, 100)}...</p></a>`)
      .join('\n');
    
    let page = TEMPLATE
      .replace(/\{\{title\}\}/g, art.title || 'Untitled')
      .replace(/\{\{description\}\}/g, art.description || '')
      .replace(/\{\{slug\}\}/g, art.slug)
      .replace(/\{\{date\}\}/g, art.date || new Date().toISOString().split('T')[0])
      .replace(/\{\{readtime\}\}/g, art.readtime)
      .replace(/\{\{content\}\}/g, html)
      .replace(/\{\{related\}\}/g, related)
      .replace(/\{\{ga_id\}\}/g, GA_ID);
    
    const outDir = path.join(DOCS_DIR, art.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), page);
    console.log(`  ✅ /${art.slug}/ (${art.wordCount} words, ${art.readtime} min)`);
  }
  
  // Generate index
  const indexHtml = generateIndex(articles);
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), indexHtml);
  console.log(`  ✅ /index.html (${articles.length} articles)`);
  
  // Sitemap
  const sitemap = generateSitemap(articles);
  fs.writeFileSync(path.join(DOCS_DIR, 'sitemap.xml'), sitemap);
  console.log(`  ✅ /sitemap.xml`);
  
  // Preserve CNAME
  const cname = path.join(DOCS_DIR, 'CNAME');
  if (!fs.existsSync(cname)) fs.writeFileSync(cname, 'smartgamesetup.com\n');
  
  // robots.txt
  fs.writeFileSync(path.join(DOCS_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://smartgamesetup.com/sitemap.xml\n`);
  console.log(`  ✅ /robots.txt`);
  
  console.log(`\n🎉 Built ${articles.length} articles → ${DOCS_DIR}`);
}

function generateIndex(articles) {
  const cards = articles.map(a => `
    <a href="/${a.slug}/" class="card">
      <div class="card-category">${a.category || 'review'}</div>
      <h2>${a.title}</h2>
      <p>${a.description || ''}</p>
      <div class="card-meta">
        <span class="stars">★★★★★</span>
        <span>${a.date} · ${a.readtime} min read</span>
      </div>
    </a>`).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartGameSetup - Level Up Your Gaming Room with Smart Tech</title>
  <meta name="description" content="Expert reviews, guides, and comparisons to help you build the ultimate smart gaming setup. From RGB lighting to ergonomic gear.">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #f1f5f9; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 0; border-bottom: 2px solid #7c3aed; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; display:flex; justify-content:space-between; align-items:center; }
    .logo { color:#7c3aed; font-size:24px; font-weight:800; text-decoration:none; }
    .logo span { color:#22d3ee; }
    nav a { color:#94a3b8; text-decoration:none; margin-left:30px; font-size:15px; }
    nav a:hover { color:#7c3aed; }
    .hero { text-align:center; padding:80px 20px 60px; background:linear-gradient(180deg,#1a1a2e,#0f0f1a); }
    .hero h1 { font-size:48px; margin-bottom:15px; }
    .hero h1 em { color:#7c3aed; font-style:normal; }
    .hero p { color:#94a3b8; font-size:20px; max-width:600px; margin:0 auto; }
    .hero .subtitle { color:#22d3ee; font-size:16px; margin-top:15px; }
    .grid { max-width:1100px; margin:0 auto; padding:40px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:25px; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; text-decoration:none; transition:all 0.3s; position:relative; overflow:hidden; }
    .card:hover { border-color:#7c3aed; transform:translateY(-3px); box-shadow:0 8px 30px rgba(124,58,237,0.2); }
    .card-category { display:inline-block; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:4px; margin-bottom:12px; }
    .card h2 { color:#f1f5f9; font-size:20px; margin-bottom:10px; }
    .card p { color:#94a3b8; font-size:15px; margin-bottom:15px; }
    .card-meta { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#64748b; }
    .card-meta .stars { color:#fbbf24; font-size:14px; letter-spacing:1px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    @media (max-width:768px) { .hero h1 { font-size:32px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/best-led-strip-lights-gaming-setup/">Lighting</a><a href="/best-gaming-desk-setup-accessories/">Desk Setup</a><a href="/govee-vs-philips-hue-gaming-lights/">Comparisons</a></nav>
  </div></header>
  <div class="hero">
    <h1>Level Up Your <em>Gaming Room</em></h1>
    <p>Expert reviews, guides, and comparisons for the ultimate smart gaming setup.</p>
    <p class="subtitle">⭐ Trusted by gamers · Updated weekly · Unbiased reviews</p>
  </div>
  <div class="grid">${cards}</div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com · <a href="/privacy/" style="color:#64748b">Privacy</a> · <a href="/about/" style="color:#64748b">About</a></p></footer>
</body>
</html>`;
}

function generateSitemap(articles) {
  const urls = articles.map(a => `  <url><loc>https://smartgamesetup.com/${a.slug}/</loc><lastmod>${a.date}</lastmod><priority>0.8</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://smartgamesetup.com/</loc><priority>1.0</priority></url>\n${urls}\n</urlset>`;
}

console.log('🔨 Building SmartGameSetup...\n');
build();

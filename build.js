const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(__dirname, 'content');
const PUBLIC_DIR = path.join(__dirname, 'public');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'article.html'), 'utf8');

function build() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const articles = [];
  
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const html = marked(content);
    const slug = data.slug || file.replace('.md', '');
    const wordCount = content.split(/\s+/).length;
    const readtime = Math.max(5, Math.ceil(wordCount / 200));
    
    let page = TEMPLATE
      .replace(/\{\{title\}\}/g, data.title || 'Untitled')
      .replace(/\{\{description\}\}/g, data.description || '')
      .replace(/\{\{slug\}\}/g, slug)
      .replace(/\{\{date\}\}/g, data.date || new Date().toISOString().split('T')[0])
      .replace(/\{\{readtime\}\}/g, readtime)
      .replace(/\{\{content\}\}/g, html);
    
    const outDir = path.join(PUBLIC_DIR, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), page);
    
    articles.push({ title: data.title, slug, date: data.date, description: data.description });
    console.log(`  ✅ /${slug}/ (${wordCount} words, ${readtime} min read)`);
  }
  
  // Generate index page
  const indexHtml = generateIndex(articles);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);
  console.log(`  ✅ /index.html (${articles.length} articles)`);
  
  // Generate sitemap
  const sitemap = generateSitemap(articles);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap);
  console.log(`  ✅ /sitemap.xml`);
  
  console.log(`\n🎉 Built ${articles.length} articles → ${PUBLIC_DIR}`);
}

function generateIndex(articles) {
  const cards = articles.map(a => `
    <a href="/${a.slug}/" class="card">
      <h2>${a.title}</h2>
      <p>${a.description || ''}</p>
      <span class="date">${a.date}</span>
    </a>
  `).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartGameSetup - Level Up Your Gaming Room with Smart Tech</title>
  <meta name="description" content="Expert reviews, guides, and comparisons to help you build the ultimate smart gaming setup. From RGB lighting to ergonomic gear.">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #f1f5f9; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 0; border-bottom: 2px solid #7c3aed; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; display:flex; justify-content:space-between; align-items:center; }
    .logo { color:#7c3aed; font-size:24px; font-weight:800; text-decoration:none; }
    .logo span { color:#22d3ee; }
    nav a { color:#94a3b8; text-decoration:none; margin-left:30px; font-size:15px; }
    .hero { text-align:center; padding:80px 20px 60px; background:linear-gradient(180deg,#1a1a2e,#0f0f1a); }
    .hero h1 { font-size:48px; margin-bottom:15px; }
    .hero h1 span { color:#7c3aed; }
    .hero p { color:#94a3b8; font-size:20px; max-width:600px; margin:0 auto; }
    .grid { max-width:1100px; margin:0 auto; padding:40px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:25px; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; text-decoration:none; transition:all 0.3s; }
    .card:hover { border-color:#7c3aed; transform:translateY(-3px); box-shadow:0 8px 30px rgba(124,58,237,0.2); }
    .card h2 { color:#f1f5f9; font-size:20px; margin-bottom:10px; }
    .card p { color:#94a3b8; font-size:15px; }
    .card .date { color:#64748b; font-size:13px; margin-top:15px; display:block; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/guides/">Guides</a><a href="/reviews/">Reviews</a><a href="/comparisons/">Comparisons</a><a href="/about/">About</a></nav>
  </div></header>
  <div class="hero">
    <h1>Level Up Your <span>Gaming Room</span></h1>
    <p>Expert reviews, guides, and comparisons for the ultimate smart gaming setup.</p>
  </div>
  <div class="grid">${cards}</div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com</p></footer>
</body>
</html>`;
}

function generateSitemap(articles) {
  const urls = articles.map(a => `  <url><loc>https://smartgamesetup.com/${a.slug}/</loc><lastmod>${a.date}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://smartgamesetup.com/</loc></url>\n${urls}\n</urlset>`;
}

console.log('🔨 Building SmartGameSetup...\n');
build();

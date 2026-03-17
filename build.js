const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(__dirname, 'content');
const DOCS_DIR = path.join(__dirname, 'docs');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'article.html'), 'utf8');

// Config
const GA_ID = 'G-DY5BY4Q3GX';
const FAVICON = '  <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n';

// Helper: inject favicon into any HTML string
function injectFavicon(html) {
  return html.replace('</head>', FAVICON + '</head>');
}

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
    
    // Extract FAQ schema from markdown content
    const faqSchema = extractFAQSchema(art.content);
    
    let page = TEMPLATE
      .replace(/\{\{title\}\}/g, art.title || 'Untitled')
      .replace(/\{\{description\}\}/g, art.description || '')
      .replace(/\{\{slug\}\}/g, art.slug)
      .replace(/\{\{date\}\}/g, art.date || new Date().toISOString().split('T')[0])
      .replace(/\{\{readtime\}\}/g, art.readtime)
      .replace(/\{\{content\}\}/g, html)
      .replace(/\{\{related\}\}/g, related)
      .replace(/\{\{ga_id\}\}/g, GA_ID);
    
    // Inject FAQ schema into <head> if FAQs were found
    if (faqSchema) {
      page = page.replace('</head>', faqSchema + '\n</head>');
    }
    
    const outDir = path.join(DOCS_DIR, art.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(page));
    console.log(`  ✅ /${art.slug}/ (${art.wordCount} words, ${art.readtime} min)`);
  }
  
  // Generate index
  const indexHtml = generateIndex(articles);
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), injectFavicon(indexHtml));
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
  
  // Category pages
  buildCategoryPage(articles, 'reviews', 'Reviews', 'In-depth product reviews to help you pick the best gear for your smart gaming setup.', ['reviews', 'review', 'listicle']);
  buildCategoryPage(articles, 'comparisons', 'Comparisons', 'Head-to-head product comparisons so you can decide which one is right for your setup.', ['comparison', 'comparisons', 'versus']);
  buildCategoryPage(articles, 'guides', 'Guides', 'Step-by-step guides to building and optimizing your smart gaming room.', ['guide', 'guides', 'how-to']);
  
  // About page
  buildAboutPage();
  
  // Privacy page
  buildPrivacyPage();
  
  // Topic pages
  for (const [key, topic] of Object.entries(TOPICS)) {
    buildTopicPage(articles, key, topic);
  }
  
  // News page
  buildNewsPage();
  
  console.log(`\n🎉 Built ${articles.length} articles + category pages → ${DOCS_DIR}`);
}

// Topic definitions
const TOPICS = {
  'smart-lighting': { name: 'Smart Lighting', icon: '💡', desc: 'RGB lights, light bars, LED strips, and smart bulbs for your gaming room' },
  'gaming-monitors': { name: 'Gaming Monitors', icon: '🖥️', desc: 'High refresh rate displays and monitor setups for competitive and immersive gaming' },
  'desk-setup': { name: 'Desk & Chairs', icon: '🪑', desc: 'Gaming desks, ergonomic chairs, and workspace essentials' },
  'smart-audio': { name: 'Smart Audio', icon: '🔊', desc: 'Soundbars, smart speakers, and audio gear for your gaming setup' },
  'power-management': { name: 'Power & Smart Plugs', icon: '⚡', desc: 'Smart plugs, surge protectors, and power management for your station' },
  'cable-management': { name: 'Cable Management', icon: '🔌', desc: 'Cable organizers, raceways, and tips to keep your setup clean' }
};

function generateIndex(articles) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Filter to current month articles
  const recent = articles
    .filter(a => String(a.date || '').slice(0, 7) === currentMonth)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  const displayArticles = recent.length > 0 ? recent : articles.slice(0, 6);
  
  const cards = displayArticles.map(a => {
    const topicKey = a.data.topic || '';
    const topicInfo = TOPICS[topicKey] || {};
    return `
    <a href="/${a.slug}/" class="card">
      <div class="card-category">${topicInfo.name || a.category || 'review'}</div>
      <h2>${a.title}</h2>
      <p>${a.description || ''}</p>
      <div class="card-meta">
        <span class="stars">★★★★★</span>
        <span>${a.date} · ${a.readtime} min read</span>
      </div>
    </a>`;
  }).join('\n');
  
  // Topic grid
  const topicCards = Object.entries(TOPICS).map(([key, t]) => {
    const count = articles.filter(a => (a.data.topic || '') === key).length;
    return `
    <a href="/topics/${key}/" class="topic-card">
      <span class="topic-icon">${t.icon}</span>
      <h3>${t.name}</h3>
      <p>${count > 0 ? count + ' article' + (count > 1 ? 's' : '') : 'Coming soon'}</p>
    </a>`;
  }).join('\n');

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = monthNames[now.getMonth()] + ' ' + now.getFullYear();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartGameSetup - Level Up Your Gaming Room with Smart Tech</title>
  <meta name="description" content="Expert reviews, guides, and comparisons to help you build the ultimate smart gaming setup. From RGB lighting to ergonomic gear.">
  <meta name="msvalidate.01" content="CEDAEA0C2A8E3076FB5A02E5BBB42D97" />
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
    .section-title { max-width:1100px; margin:0 auto; padding:40px 20px 10px; font-size:28px; font-weight:700; }
    .section-title em { color:#7c3aed; font-style:normal; }
    .section-subtitle { max-width:1100px; margin:0 auto; padding:0 20px; color:#64748b; font-size:15px; }
    .topics-grid { max-width:1100px; margin:0 auto; padding:30px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:15px; }
    .topic-card { background:#1a1a2e; border:1px solid #334155; border-radius:10px; padding:20px; text-decoration:none; text-align:center; transition:all 0.3s; }
    .topic-card:hover { border-color:#7c3aed; transform:translateY(-2px); box-shadow:0 4px 15px rgba(124,58,237,0.2); }
    .topic-icon { font-size:32px; display:block; margin-bottom:8px; }
    .topic-card h3 { color:#f1f5f9; font-size:14px; margin-bottom:4px; }
    .topic-card p { color:#64748b; font-size:12px; margin:0; }
    .grid { max-width:1100px; margin:0 auto; padding:20px 20px 40px; display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:25px; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; text-decoration:none; transition:all 0.3s; position:relative; overflow:hidden; }
    .card:hover { border-color:#7c3aed; transform:translateY(-3px); box-shadow:0 8px 30px rgba(124,58,237,0.2); }
    .card-category { display:inline-block; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:4px; margin-bottom:12px; }
    .card h2 { color:#f1f5f9; font-size:20px; margin-bottom:10px; }
    .card p { color:#94a3b8; font-size:15px; margin-bottom:15px; }
    .card-meta { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#64748b; }
    .card-meta .stars { color:#fbbf24; font-size:14px; letter-spacing:1px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    @media (max-width:768px) { .hero h1 { font-size:32px; } .grid { grid-template-columns:1fr; } .topics-grid { grid-template-columns:repeat(3,1fr); } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="hero">
    <h1>Level Up Your <em>Gaming Room</em></h1>
    <p>Expert reviews, guides, and comparisons for the ultimate smart gaming setup.</p>
    <p class="subtitle">⭐ Trusted by gamers · Updated weekly · Unbiased reviews</p>
  </div>
  <h2 class="section-title">📂 Browse by <em>Category</em></h2>
  <div class="topics-grid">${topicCards}</div>
  <h2 class="section-title">🆕 Latest — <em>${monthLabel}</em></h2>
  <p class="section-subtitle">${displayArticles.length} articles this month</p>
  <div class="grid">${cards}</div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com · <a href="/privacy/" style="color:#64748b">Privacy</a> · <a href="/about/" style="color:#64748b">About</a></p></footer>
</body>
</html>`;
}

function generateSitemap(articles) {
  const urls = articles.map(a => `  <url><loc>https://smartgamesetup.com/${a.slug}/</loc><lastmod>${a.date}</lastmod><priority>0.8</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://smartgamesetup.com/</loc><priority>1.0</priority></url>\n${urls}\n</urlset>`;
}

function buildCategoryPage(articles, slug, title, desc, categories) {
  const filtered = articles.filter(a => categories.includes((a.category || '').toLowerCase()));
  // If no articles match the category, show all articles as fallback
  const display = filtered.length > 0 ? filtered : articles;
  
  const cards = display.map(a => `
    <a href="/${a.slug}/" class="card">
      <div class="card-category">${a.category || 'review'}</div>
      <h2>${a.title}</h2>
      <p>${(a.description || '').slice(0, 150)}...</p>
      <div class="card-meta">
        <span class="stars">★★★★★</span>
        <span>${a.readtime} min read</span>
      </div>
    </a>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SmartGameSetup</title>
  <meta name="description" content="${desc}">
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
    .hero { text-align:center; padding:60px 20px 40px; background:linear-gradient(180deg,#1a1a2e,#0f0f1a); }
    .hero h1 { font-size:42px; margin-bottom:15px; color:#f1f5f9; }
    .hero h1 em { color:#7c3aed; font-style:normal; }
    .hero p { color:#94a3b8; font-size:18px; max-width:600px; margin:0 auto; }
    .grid { max-width:1100px; margin:0 auto; padding:40px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:25px; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; text-decoration:none; transition:all 0.3s; }
    .card:hover { border-color:#7c3aed; transform:translateY(-3px); box-shadow:0 8px 30px rgba(124,58,237,0.2); }
    .card-category { display:inline-block; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:4px; margin-bottom:12px; }
    .card h2 { color:#f1f5f9; font-size:20px; margin-bottom:10px; }
    .card p { color:#94a3b8; font-size:15px; margin-bottom:15px; }
    .card-meta { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#64748b; }
    .card-meta .stars { color:#fbbf24; font-size:14px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    .empty { text-align:center; padding:80px 20px; color:#64748b; font-size:18px; }
    @media (max-width:768px) { .hero h1 { font-size:32px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="hero">
    <h1><em>${title}</em></h1>
    <p>${desc}</p>
  </div>
  ${display.length > 0 ? `<div class="grid">${cards}</div>` : '<div class="empty">Coming soon! Check back for new content.</div>'}
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com</p></footer>
</body>
</html>`;

  const outDir = path.join(DOCS_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(html));
  console.log(`  ✅ /${slug}/ (${display.length} articles)`);
}

function buildAboutPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Us - SmartGameSetup</title>
  <meta name="description" content="Learn about SmartGameSetup — your trusted source for smart gaming room reviews, guides, and comparisons.">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #f1f5f9; line-height:1.7; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 0; border-bottom: 2px solid #7c3aed; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; display:flex; justify-content:space-between; align-items:center; }
    .logo { color:#7c3aed; font-size:24px; font-weight:800; text-decoration:none; }
    .logo span { color:#22d3ee; }
    nav a { color:#94a3b8; text-decoration:none; margin-left:30px; font-size:15px; }
    nav a:hover { color:#7c3aed; }
    .content { max-width:800px; margin:0 auto; padding:60px 20px 80px; }
    .content h1 { font-size:42px; margin-bottom:30px; color:#f1f5f9; }
    .content h1 em { color:#7c3aed; font-style:normal; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:40px; margin-bottom:30px; }
    .card h2 { color:#7c3aed; font-size:24px; margin-bottom:15px; }
    .card h2 .emoji { margin-right:10px; }
    .card p { color:#94a3b8; font-size:17px; margin-bottom:12px; }
    .card ul { color:#94a3b8; margin:12px 0 12px 25px; }
    .card li { margin:8px 0; font-size:16px; }
    .card strong { color:#f1f5f9; }
    .highlight { color:#22d3ee; }
    .values { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; margin:20px 0; }
    .value-item { background:#16213e; border-radius:10px; padding:20px; text-align:center; }
    .value-item .icon { font-size:36px; margin-bottom:10px; }
    .value-item h3 { color:#f1f5f9; font-size:16px; margin-bottom:5px; }
    .value-item p { color:#64748b; font-size:14px; margin:0; }
    .cta { background:linear-gradient(135deg,#7c3aed,#5b21b6); border-radius:12px; padding:40px; text-align:center; }
    .cta h2 { color:#fff; margin-bottom:10px; }
    .cta p { color:#e2e8f0; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    @media (max-width:768px) { .content h1 { font-size:32px; } .values { grid-template-columns:1fr 1fr; } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="content">
    <h1>About <em>SmartGameSetup</em></h1>
    
    <div class="card">
      <h2><span class="emoji">🎮</span> Who We Are</h2>
      <p>SmartGameSetup is your go-to resource for building the <strong>ultimate gaming room</strong> powered by smart technology. We combine the worlds of <span class="highlight">gaming peripherals</span> and <span class="highlight">smart home devices</span> to help you create an immersive, efficient, and seriously cool gaming environment.</p>
      <p>Founded in 2026, we're a team of gamers and tech enthusiasts who believe your gaming setup should be as smart as the games you play.</p>
    </div>

    <div class="card">
      <h2><span class="emoji">🔍</span> What We Do</h2>
      <p>We research, test, and review products so you don't have to waste money on gear that doesn't deliver. Our content includes:</p>
      <ul>
        <li><strong>In-Depth Reviews</strong> — Honest, detailed breakdowns of the latest gaming and smart home products</li>
        <li><strong>Head-to-Head Comparisons</strong> — Side-by-side analysis to help you choose between competing products</li>
        <li><strong>Setup Guides</strong> — Step-by-step tutorials for building your dream gaming room</li>
        <li><strong>Buyer's Guides</strong> — Curated recommendations for every budget</li>
      </ul>
    </div>

    <div class="card">
      <h2><span class="emoji">💡</span> Our Values</h2>
      <div class="values">
        <div class="value-item">
          <div class="icon">🎯</div>
          <h3>Honest Reviews</h3>
          <p>No fluff, no paid rankings</p>
        </div>
        <div class="value-item">
          <div class="icon">🧪</div>
          <h3>Real Testing</h3>
          <p>We use what we recommend</p>
        </div>
        <div class="value-item">
          <div class="icon">💰</div>
          <h3>Budget Friendly</h3>
          <p>Options for every wallet</p>
        </div>
        <div class="value-item">
          <div class="icon">🔄</div>
          <h3>Always Updated</h3>
          <p>Reviews refreshed regularly</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2><span class="emoji">💼</span> Affiliate Disclosure</h2>
      <p>SmartGameSetup is reader-supported. When you buy through links on our site, we may earn an affiliate commission at <strong>no extra cost to you</strong>. This helps us keep the site running and continue creating free, high-quality content.</p>
      <p>Our editorial opinions are always our own. We never let affiliate relationships influence our reviews or recommendations. If a product isn't good, we'll tell you — even if we could earn a commission from it.</p>
    </div>

    <div class="cta">
      <h2>🚀 Level Up Your Setup</h2>
      <p>Browse our latest reviews and start building your dream gaming room today.</p>
    </div>
  </div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com</p></footer>
</body>
</html>`;

  const outDir = path.join(DOCS_DIR, 'about');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(html));
  console.log('  ✅ /about/');
}

function buildPrivacyPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - SmartGameSetup</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, sans-serif; background:#0f0f1a; color:#94a3b8; line-height:1.7; }
    .header { background:#1a1a2e; padding:20px 0; border-bottom:2px solid #7c3aed; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; display:flex; justify-content:space-between; align-items:center; }
    .logo { color:#7c3aed; font-size:24px; font-weight:800; text-decoration:none; }
    .logo span { color:#22d3ee; }
    nav a { color:#94a3b8; text-decoration:none; margin-left:30px; font-size:15px; }
    .content { max-width:800px; margin:0 auto; padding:60px 20px 80px; }
    .content h1 { color:#f1f5f9; font-size:36px; margin-bottom:30px; }
    .content h2 { color:#f1f5f9; font-size:22px; margin:30px 0 10px; }
    .content p { margin:10px 0; font-size:16px; }
    .content ul { margin:10px 0 10px 25px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="content">
    <h1>Privacy Policy</h1>
    <p><em>Last updated: March 15, 2026</em></p>
    
    <h2>Information We Collect</h2>
    <p>SmartGameSetup uses Google Analytics to collect anonymous usage data such as page views, time on site, and device type. We do not collect personal information unless you voluntarily provide it.</p>
    
    <h2>Cookies</h2>
    <p>We use cookies for analytics purposes only. You can disable cookies in your browser settings at any time.</p>
    
    <h2>Affiliate Links</h2>
    <p>Our site contains affiliate links to Amazon.com and other retailers. When you click these links and make a purchase, we may earn a commission. This does not affect the price you pay or our editorial independence.</p>
    
    <h2>Third-Party Services</h2>
    <ul>
      <li><strong>Google Analytics</strong> — For anonymous traffic analysis</li>
      <li><strong>Amazon Associates</strong> — For product affiliate links</li>
      <li><strong>GitHub Pages</strong> — For website hosting</li>
    </ul>
    
    <h2>Your Rights</h2>
    <p>You have the right to opt out of analytics tracking by using browser extensions like uBlock Origin or disabling JavaScript. No personal data is stored on our servers.</p>
    
    <h2>Contact</h2>
    <p>Questions about this policy? Reach out via our GitHub repository.</p>
  </div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com</p></footer>
</body>
</html>`;

  const outDir = path.join(DOCS_DIR, 'privacy');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(html));
  console.log('  ✅ /privacy/');
}

function buildTopicPage(articles, topicKey, topic) {
  const filtered = articles.filter(a => (a.data.topic || '') === topicKey);
  
  const cards = filtered.map(a => `
    <a href="/${a.slug}/" class="card">
      <div class="card-category">${a.category || 'review'}</div>
      <h2>${a.title}</h2>
      <p>${(a.description || '').slice(0, 150)}...</p>
      <div class="card-meta">
        <span class="stars">★★★★★</span>
        <span>${a.date} · ${a.readtime} min read</span>
      </div>
    </a>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic.name} - SmartGameSetup</title>
  <meta name="description" content="${topic.desc}">
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
    .hero { text-align:center; padding:60px 20px 40px; background:linear-gradient(180deg,#1a1a2e,#0f0f1a); }
    .hero h1 { font-size:42px; margin-bottom:15px; }
    .hero h1 em { color:#7c3aed; font-style:normal; }
    .hero p { color:#94a3b8; font-size:18px; max-width:600px; margin:0 auto; }
    .hero .icon { font-size:48px; margin-bottom:15px; }
    .grid { max-width:1100px; margin:0 auto; padding:40px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:25px; }
    .card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; text-decoration:none; transition:all 0.3s; }
    .card:hover { border-color:#7c3aed; transform:translateY(-3px); box-shadow:0 8px 30px rgba(124,58,237,0.2); }
    .card-category { display:inline-block; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:4px; margin-bottom:12px; }
    .card h2 { color:#f1f5f9; font-size:20px; margin-bottom:10px; }
    .card p { color:#94a3b8; font-size:15px; margin-bottom:15px; }
    .card-meta { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#64748b; }
    .card-meta .stars { color:#fbbf24; font-size:14px; }
    .empty { text-align:center; padding:80px 20px; color:#64748b; font-size:18px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    @media (max-width:768px) { .hero h1 { font-size:32px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="hero">
    <div class="icon">${topic.icon}</div>
    <h1><em>${topic.name}</em></h1>
    <p>${topic.desc}</p>
  </div>
  ${filtered.length > 0 ? `<div class="grid">${cards}</div>` : '<div class="empty">🚧 Articles coming soon! Check back for new content.</div>'}
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com · <a href="/" style="color:#64748b">Home</a> · <a href="/about/" style="color:#64748b">About</a></p></footer>
</body>
</html>`;

  const outDir = path.join(DOCS_DIR, 'topics', topicKey);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(html));
  console.log(`  ✅ /topics/${topicKey}/ (${filtered.length} articles)`);
}

function buildNewsPage() {
  const newsItems = [
    {
      title: 'Philips Hue SpatialAware Smart Lighting',
      tag: 'CES 2026',
      desc: 'Philips Hue\'s next-gen system uses AR to scan your room via smartphone camera, creating a 3D spatial map of every light. Colors are distributed intentionally based on actual placement — sunset scenes flow naturally across the room. A game-changer for immersive gaming atmospheres.',
      expected: 'Expected Q3 2026',
      icon: '💡'
    },
    {
      title: 'ASUS ROG AniME Holo Lighting System',
      tag: 'CES 2026',
      desc: 'Embedded directly into glass PC panels, AniME Holo projects full-color holographic animations across three distinct zones. Debuted on the ROG G1000 desktop — expect standalone panels and ecosystem integration later this year.',
      expected: 'Expected Mid 2026',
      icon: '🖥️'
    },
    {
      title: 'Govee Spherical Net Lights',
      tag: 'Spotted in CSA Database',
      desc: 'Govee\'s upcoming smart outdoor lighting product was recently found in the Connectivity Standards Alliance database, hinting at Matter support out of the box. Could double as ambient gaming room décor with its unique spherical net design.',
      expected: 'Expected 2026',
      icon: '🌐'
    },
    {
      title: 'Nanoleaf x Umbra Cono (New Colors)',
      tag: 'Rumored',
      desc: 'The premium smart light collab between Nanoleaf and Umbra is reportedly getting new colorways and a gaming-focused preset pack. The original Cono is already a top-tier desk accent — new variants could be perfect for streaming setups.',
      expected: 'Expected Spring 2026',
      icon: '🔺'
    },
    {
      title: 'Lenovo Legion Pro Rollable Display',
      tag: 'CES 2026',
      desc: 'A gaming laptop with a screen that physically expands from 16" to 24" ultrawide via dual-motor design. Three modes: Focus (16"), Tactical (21.5"), and Arena (24"). Powered by Intel Core Ultra + RTX 5090. Built for esports athletes who travel.',
      expected: 'Expected Late 2026',
      icon: '💻'
    },
    {
      title: 'Philips Hue Essential Smart Bulbs',
      tag: 'New Release',
      desc: 'A more affordable entry point into the Hue ecosystem. Full color range, Matter-compatible, and works with existing Hue bridges. Great for gamers wanting to start with smart lighting without the premium price tag.',
      expected: 'Available Now',
      icon: '💰'
    }
  ];

  const cards = newsItems.map(item => `
    <div class="news-card">
      <div class="news-icon">${item.icon}</div>
      <div class="news-content">
        <div class="news-tags">
          <span class="news-tag">${item.tag}</span>
          <span class="news-date">${item.expected}</span>
        </div>
        <h2>${item.title}</h2>
        <p>${item.desc}</p>
      </div>
    </div>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News - Upcoming Smart Gaming Products | SmartGameSetup</title>
  <meta name="description" content="Upcoming smart gaming products worth watching — from CES 2026 reveals to rumored releases. Stay ahead of the curve.">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #f1f5f9; line-height:1.7; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 0; border-bottom: 2px solid #7c3aed; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; display:flex; justify-content:space-between; align-items:center; }
    .logo { color:#7c3aed; font-size:24px; font-weight:800; text-decoration:none; }
    .logo span { color:#22d3ee; }
    nav a { color:#94a3b8; text-decoration:none; margin-left:30px; font-size:15px; }
    nav a:hover { color:#7c3aed; }
    .hero { text-align:center; padding:60px 20px 40px; background:linear-gradient(180deg,#1a1a2e,#0f0f1a); }
    .hero h1 { font-size:42px; margin-bottom:15px; }
    .hero h1 em { color:#7c3aed; font-style:normal; }
    .hero p { color:#94a3b8; font-size:18px; max-width:600px; margin:0 auto; }
    .news-list { max-width:800px; margin:0 auto; padding:40px 20px; }
    .news-card { background:#1a1a2e; border:1px solid #334155; border-radius:12px; padding:30px; margin-bottom:20px; display:flex; gap:20px; transition:all 0.3s; }
    .news-card:hover { border-color:#7c3aed; box-shadow:0 4px 20px rgba(124,58,237,0.15); }
    .news-icon { font-size:40px; flex-shrink:0; width:60px; height:60px; display:flex; align-items:center; justify-content:center; background:#16213e; border-radius:12px; }
    .news-content { flex:1; }
    .news-tags { display:flex; gap:10px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
    .news-tag { display:inline-block; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:3px 8px; border-radius:4px; }
    .news-date { color:#22d3ee; font-size:13px; font-weight:600; }
    .news-content h2 { font-size:20px; margin-bottom:8px; color:#f1f5f9; }
    .news-content p { color:#94a3b8; font-size:15px; margin:0; }
    .updated { text-align:center; color:#64748b; font-size:14px; padding:20px; }
    .footer { text-align:center; padding:40px; color:#64748b; font-size:14px; }
    @media (max-width:768px) { .hero h1 { font-size:32px; } .news-card { flex-direction:column; } .news-icon { width:50px; height:50px; font-size:30px; } }
  </style>
</head>
<body>
  <header class="header"><div class="header-inner">
    <a href="/" class="logo">Smart<span>Game</span>Setup</a>
    <nav><a href="/">Home</a><a href="/about/">About</a><a href="/news/">News</a></nav>
  </div></header>
  <div class="hero">
    <h1>🚀 <em>Upcoming</em> Products</h1>
    <p>New and unreleased smart gaming gear worth keeping an eye on.</p>
  </div>
  <div class="news-list">
    ${cards}
  </div>
  <div class="updated">Last updated: March 2026</div>
  <footer class="footer"><p>&copy; 2026 SmartGameSetup.com · <a href="/privacy/" style="color:#64748b">Privacy</a> · <a href="/about/" style="color:#64748b">About</a></p></footer>
</body>
</html>`;

  const outDir = path.join(DOCS_DIR, 'news');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), injectFavicon(html));
  console.log('  ✅ /news/');
}

function extractFAQSchema(markdownContent) {
  // Normalize line endings to \n
  const content = markdownContent.replace(/\r\n/g, '\n');
  
  // Find FAQ section (## FAQ or ## Frequently Asked Questions)
  const faqMatch = content.match(/## (?:FAQ|Frequently Asked Questions)\s*\n([\s\S]*?)(?=\n## [^#]|\n---\s*$|$)/i);
  if (!faqMatch) return null;
  
  const faqSection = faqMatch[1];
  
  // Extract Q&A pairs - support ### headings and **Q:** format
  const qaItems = [];
  
  // Pattern 1: ### Question\n\nAnswer
  const headingPattern = /### (.+?)\n\n?([\s\S]*?)(?=\n### |\n## |$)/g;
  let match;
  while ((match = headingPattern.exec(faqSection)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim().replace(/\n+/g, ' ').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (question && answer) {
      qaItems.push({ question, answer });
    }
  }
  
  // Pattern 2: **Q: question**\nA: answer
  if (qaItems.length === 0) {
    const qPattern = /\*\*(?:Q:\s*)?(.+?)\*\*\s*\n+(?:A:\s*)?(.+?)(?=\n\n\*\*|\n## |$)/g;
    while ((match = qPattern.exec(faqSection)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim().replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      if (question && answer) {
        qaItems.push({ question, answer });
      }
    }
  }
  
  if (qaItems.length === 0) return null;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": qaItems.map(qa => ({
      "@type": "Question",
      "name": qa.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": qa.answer
      }
    }))
  };
  
  return `  <script type="application/ld+json">\n  ${JSON.stringify(schema, null, 2).split('\n').join('\n  ')}\n  </script>`;
}

console.log('🔨 Building SmartGameSetup...\n');
build();

const fs = require('fs');
const fixes = {
  'best-smart-power-strip-gaming-desk-setup-2026.md': 'power-management',
  'philips-hue-play-bar-vs-govee-light-bar-gaming.md': 'smart-lighting',
  'how-to-build-smart-gaming-setup-budget.md': 'desk-setup',
  'best-streaming-camera-gaming-setup-2026.md': 'gaming-monitors',
  'amazon-echo-vs-homepod-mini-gaming-setup.md': 'smart-audio',
};

for (const [file, topic] of Object.entries(fixes)) {
  const p = 'content/' + file;
  let content = fs.readFileSync(p, 'utf8');
  // Replace 'category: xxx' with 'topic: "xxx"\ncategory: "reviews"'
  content = content.replace(/category: [\w-]+/, `topic: "${topic}"\ncategory: "reviews"`);
  // Wrap date in quotes
  content = content.replace(/date: (\d{4}-\d{2}-\d{2})$/m, 'date: "$1"');
  fs.writeFileSync(p, content);
  console.log('Fixed:', file);
}

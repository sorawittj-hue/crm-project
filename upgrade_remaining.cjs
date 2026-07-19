const fs = require('fs');
const path = require('path');

const pages = [
  'SalesTrackingPage.jsx',
  'PipelinePage.jsx',
  'SettingsPage.jsx'
];

pages.forEach(page => {
  const filePath = path.join(__dirname, 'src', 'pages', page);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Upgrade basic cards
  content = content.replace(/className="(.*?)bg-white(.*?)border-slate-100(.*?)hover:shadow-\[.*?\](.*?)"/g, 
    (match, p1, p2, p3, p4) => {
      return `className="${p1}bg-white/90 backdrop-blur-xl${p2}border-violet-100/50${p3}hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300${p4}"`;
    }
  );

  // Upgrade borders
  content = content.replace(/border-slate-100/g, 'border-violet-100/50');
  content = content.replace(/border-slate-200/g, 'border-violet-100');

  // Add ambient glows if not present
  if (!content.includes('bg-violet-400/5 rounded-full blur-[120px]')) {
    content = content.replace(/(className="max-w-\w+ mx-auto.*?relative")/, 
      `$1>\n        {/* Ambient Glows */}\n        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />\n        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />\n      `
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Upgraded ${page}`);
});

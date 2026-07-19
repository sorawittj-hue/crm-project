const fs = require('fs');
const path = require('path');

const analyticsPath = path.join(__dirname, 'src', 'pages', 'AnalyticsPage.jsx');
const customersPath = path.join(__dirname, 'src', 'pages', 'CustomersPage.jsx');

function upgradeAnalytics() {
  let content = fs.readFileSync(analyticsPath, 'utf8');

  // 1. Ambient glow blobs - already in AnalyticsPage, but let's ensure it.

  // 2. Upgrade ALL Card elements to premium glassmorphism
  // Replace old Card classNames that start with bg-white
  content = content.replace(/className="(.*?)bg-white\/70 backdrop-blur-2xl(.*?)hover:shadow-\[.*?\](.*?)"/g, 
    (match, p1, p2, p3) => {
      return `className="${p1}bg-white/90 backdrop-blur-3xl${p2}hover:shadow-[0_8px_32px_rgba(139,92,246,0.10)] hover:border-violet-100 hover:-translate-y-0.5 transition-all duration-300${p3}"`;
    }
  );

  // 3. Section headers
  content = content.replace(/<h3 className=".*?pl-3 border-l-2 border-violet-500">(.*?)<\/h3>/g, 
    (match, titleText) => {
      return `<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-violet-500/20" style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'}}><Sparkles size={18} /></div><h3 className="text-xl font-black tracking-tight text-slate-800">${titleText}</h3></div>`;
    }
  );

  // 4. Progress bars glow
  content = content.replace(/className="(h-full bg-emerald-500 rounded-full)"/g, 'className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"');
  content = content.replace(/className="(h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full)"/g, 'className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"');
  
  fs.writeFileSync(analyticsPath, content, 'utf8');
  console.log('Upgraded AnalyticsPage.jsx');
}

function upgradeCustomers() {
  let content = fs.readFileSync(customersPath, 'utf8');

  // 1. Add ambient glows (if not present)
  if (!content.includes('bg-violet-400/5 rounded-full blur-[120px]')) {
    content = content.replace(/className="max-w-\[1600px\] mx-auto space-y-6 pb-20 px-4 md:px-6 relative"/, 
      `className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-6 relative"\n      >\n        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />\n        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />\n      `
    );
  }

  // 2. Upgrade card elements (border and hover)
  // Replace old border-slate-100 or border-slate-200 with violet-100/50
  content = content.replace(/border-slate-100/g, 'border-violet-100/50');
  // Add hover effects to the list items (Card or Tr)
  content = content.replace(/hover:bg-slate-50\/50/g, 'hover:bg-violet-50/20 hover:border-violet-200 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] hover:-translate-y-[1px] transition-all duration-300');

  // 3. Avatar elements
  content = content.replace(/bg-violet-100 text-violet-700/g, "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]");
  
  // 4. Input styling
  content = content.replace(/focus:ring-2 focus:ring-violet-500\/20/g, 'focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400');

  // 5. Win/Loss Badges
  content = content.replace(/bg-emerald-100 text-emerald-700/g, 'bg-emerald-50 text-emerald-700 border border-emerald-200');
  content = content.replace(/bg-rose-100 text-rose-700/g, 'bg-rose-50 text-rose-700 border border-rose-200');

  fs.writeFileSync(customersPath, content, 'utf8');
  console.log('Upgraded CustomersPage.jsx');
}

upgradeAnalytics();
upgradeCustomers();

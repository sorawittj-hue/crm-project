// ==========================================
// Shell: Sidebar + Header + Notifications + Tweaks
// ==========================================
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const formatTHB = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.00$/, '') + 'M ฿';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K ฿';
  return n + ' ฿';
};
const formatTHBFull = (n) => new Intl.NumberFormat('th-TH').format(Math.round(n)) + ' ฿';

// =========== Icons (inline SVG, stroke-based) ==============
const I = {
  home:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>,
  pipeline: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>,
  users:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>,
  tools:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6l-6.4 6.4a1.5 1.5 0 0 0 2.1 2.1l6.4-6.4a4.5 4.5 0 0 0 6-6l-2.6 2.6-2.5-.5-.5-2.5z"/></svg>,
  bell:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  search:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  plus:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  x:        (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  arrow:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowUp:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17 17 7M8 7h9v9"/></svg>,
  arrowDn:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 7 7 17M16 17H7V8"/></svg>,
  sparkle:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  fire:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8.5 14.5A4 4 0 0 0 12 21a4 4 0 0 0 4-4c0-1.5-.5-2-1.5-3.5S13 11 13 10c0-1 .5-2 2-3-3 0-5 2-5 5 0 1-1 2-1.5 2.5"/></svg>,
  clock:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  filter:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18M6 12h12M10 19h4"/></svg>,
  star:     (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>,
  phone:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>,
  mail:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>,
  calc:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M16 14h0M8 18h2M12 18h6"/></svg>,
  brain:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.5A3 3 0 0 0 4 8v1a3 3 0 0 0-1 2.5A3 3 0 0 0 4 14v1a3 3 0 0 0 3 3v1A2.5 2.5 0 0 0 9.5 22H12V2z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.5a3 3 0 0 1 3 3v1a3 3 0 0 1 1 2.5 3 3 0 0 1-1 2.5v1a3 3 0 0 1-3 3v1a2.5 2.5 0 0 1-2.5 2.5H12V2z"/></svg>,
  heart:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2.5 4.65-9.5 9-9.5 9z"/></svg>,
  close:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  menu:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bolt:     (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>,
  target:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
};

// =========== Logo ==============
function Logo({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35,
      background: 'linear-gradient(135deg, var(--pink-300), var(--lavender-400))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 20px -6px rgba(255, 120, 180, 0.4)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)',
      }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
           style={{ width: size * 0.55, height: size * 0.55, position: 'relative', zIndex: 1 }}>
        <path d="M4 17 L10 11 L14 15 L20 7" />
        <circle cx="20" cy="7" r="2" fill="white" stroke="none" />
      </svg>
    </div>
  );
}

// =========== Sidebar ==============
function Sidebar({ page, setPage, goalPct, monthlyValue, monthlyTarget }) {
  const navItems = [
    { id: 'command',   label: 'หน้าแรก',        sub: 'Command Center', Icon: I.home },
    { id: 'pipeline',  label: 'ดีลทั้งหมด',      sub: 'Pipeline',       Icon: I.pipeline },
    { id: 'customers', label: 'ลูกค้า',         sub: 'Customers',      Icon: I.users },
    { id: 'analytics', label: 'วิเคราะห์ยอดขาย', sub: 'Analytics',      Icon: I.chart },
    { id: 'tools',     label: 'เครื่องมือ',      sub: 'Tools & AI',     Icon: I.tools },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo size={44} />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Zenith</div>
          <div className="sidebar-brand-sub">ระบบจัดการลูกค้า</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'is-active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon-wrap">
                <item.Icon width={20} height={20} />
              </span>
              <span className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-sub">{item.sub}</span>
              </span>
              {active && <span className="nav-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="goal-card">
          <div className="goal-header">
            <div className="goal-title">
              <span style={{fontSize: 18}}>🎯</span>
              <span>เป้าเดือนนี้</span>
            </div>
            <div className="goal-pct">{goalPct}%</div>
          </div>
          <div className="goal-amounts">
            <span className="goal-value">{formatTHB(monthlyValue)}</span>
            <span className="goal-target">จาก {formatTHB(monthlyTarget)}</span>
          </div>
          <div className="goal-bar">
            <div className="goal-bar-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="goal-footer-text">
            ✨ อีก {formatTHB(Math.max(0, monthlyTarget - monthlyValue))} ถึงเป้า!
          </div>
        </div>

        <div className="user-chip">
          <div className="user-avatar">🦊</div>
          <div className="user-info">
            <div className="user-name">สรวิชญ์ ต.</div>
            <div className="user-role">Team Lead</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// =========== Notifications drawer ==============
function NotificationsDrawer({ open, onClose, items }) {
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`notif-drawer ${open ? 'is-open' : ''}`}>
        <div className="notif-head">
          <div>
            <div className="notif-title">การแจ้งเตือน</div>
            <div className="notif-sub">{items.length} รายการใหม่</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.close width={18} height={18}/></button>
        </div>
        <div className="notif-list">
          {items.map(n => (
            <div key={n.id} className={`notif-item notif-${n.kind}`}>
              <div className="notif-emoji">{n.emoji}</div>
              <div className="notif-body">
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-text">{n.body}</div>
                <div className="notif-item-time">{n.when}ที่แล้ว</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

// =========== Header ==============
function Header({ onBellClick, notifCount, search, setSearch, pageTitle, pageSubtitle }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <div>
          <div className="page-title">{pageTitle}</div>
          <div className="page-subtitle">{pageSubtitle}</div>
        </div>
      </div>
      <div className="app-header-right">
        <div className="search-wrap">
          <I.search width={16} height={16} />
          <input
            type="text"
            placeholder="ค้นหาดีล, ลูกค้า, บริษัท..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </div>
        <button className="bell-btn" onClick={onBellClick}>
          <I.bell width={20} height={20} />
          {notifCount > 0 && <span className="bell-dot">{notifCount}</span>}
        </button>
      </div>
    </header>
  );
}

// =========== Toast ==============
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast">
      <div className="toast-emoji">{toast.emoji || '✨'}</div>
      <div>
        <div className="toast-title">{toast.title}</div>
        {toast.body && <div className="toast-body">{toast.body}</div>}
      </div>
    </div>
  );
}

Object.assign(window, {
  I, Logo, Sidebar, NotificationsDrawer, Header, Toast,
  formatTHB, formatTHBFull,
});

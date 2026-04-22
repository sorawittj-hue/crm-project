// src/components/layout/AppLayout.jsx
// ทับของเดิมได้เลย — ใช้ hooks เดิม (useAppStore, useDeals, useSettings)

import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ListTree, Users, BarChart3, Wrench, Bell, Search, Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useSettings } from '../../hooks/useSettings';

const formatTHB = (n) => {
  if (!n) return '0 ฿';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.00$/, '') + 'M ฿';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K ฿';
  return Math.round(n) + ' ฿';
};

const NAV = [
  { to: '/command',   icon: Home,     label: 'หน้าแรก',        sub: 'Command Center' },
  { to: '/pipeline',  icon: ListTree, label: 'ดีลทั้งหมด',      sub: 'Pipeline' },
  { to: '/customers', icon: Users,    label: 'ลูกค้า',         sub: 'Customers' },
  { to: '/analytics', icon: BarChart3,label: 'วิเคราะห์ยอดขาย', sub: 'Analytics' },
  { to: '/tools',     icon: Wrench,   label: 'เครื่องมือ',      sub: 'Tools & AI' },
];

export default function AppLayout() {
  const { isSidebarOpen, closeSidebar, toggleSidebar, globalSearchTerm, setGlobalSearchTerm } = useAppStore();
  const { data: deals = [] } = useDeals();
  const { data: settings } = useSettings();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    document.body.classList.add('zenith-kawaii');
    return () => document.body.classList.remove('zenith-kawaii');
  }, []);

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const monthlyTarget = settings?.monthly_target || 7_000_000;
  const wonThisMonth = useMemo(() => {
    const now = new Date();
    return deals
      .filter(d => d.stage === 'won'
        && new Date(d.created_at).getMonth() === now.getMonth()
        && new Date(d.created_at).getFullYear() === now.getFullYear())
      .reduce((s, d) => s + Number(d.value || 0), 0);
  }, [deals]);
  const goalPct = Math.min(100, Math.round((wonThisMonth / monthlyTarget) * 100));

  const titles = {
    '/command':   { title: 'หน้าแรก',           sub: 'ภาพรวมทีมและงานวันนี้' },
    '/pipeline':  { title: 'ดีลทั้งหมด',         sub: 'ลากเพื่อเปลี่ยนสถานะดีล' },
    '/customers': { title: 'ลูกค้าของเรา',       sub: 'รวมฐานข้อมูลลูกค้าทั้งหมด' },
    '/analytics': { title: 'วิเคราะห์ยอดขาย',    sub: 'ข้อมูลเชิงลึกและแนวโน้ม' },
    '/tools':     { title: 'เครื่องมือ & AI',     sub: 'ตัวช่วยสำหรับทีมขาย' },
  }[location.pathname] || { title: '', sub: '' };

  return (
    <div className="app">
      {/* Sidebar */}
      {(isSidebarOpen || isDesktop) && (
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div style={{width:44,height:44,borderRadius:16,background:'linear-gradient(135deg,var(--pink-300),var(--lav-400))',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 20px -6px rgba(255,120,180,0.4)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
                <path d="M4 17 L10 11 L14 15 L20 7"/>
                <circle cx="20" cy="7" r="2" fill="white" stroke="none"/>
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">Zenith</div>
              <div className="sidebar-brand-sub">ระบบจัดการลูกค้า</div>
            </div>
            {!isDesktop && <button onClick={closeSidebar} style={{marginLeft:'auto'}}><X size={18}/></button>}
          </div>

          <nav className="sidebar-nav">
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({isActive}) => `nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => !isDesktop && closeSidebar()}>
                {({isActive}) => (<>
                  <span className="nav-icon-wrap"><item.icon size={20}/></span>
                  <span className="nav-text">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-sub">{item.sub}</span>
                  </span>
                  {isActive && <span className="nav-dot"/>}
                </>)}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="goal-card">
              <div className="goal-header">
                <div className="goal-title"><span style={{fontSize:18}}>🎯</span><span>เป้าเดือนนี้</span></div>
                <div className="goal-pct">{goalPct}%</div>
              </div>
              <div className="goal-amounts">
                <span className="goal-value">{formatTHB(wonThisMonth)}</span>
                <span className="goal-target">จาก {formatTHB(monthlyTarget)}</span>
              </div>
              <div className="goal-bar">
                <div className="goal-bar-fill" style={{width:`${goalPct}%`}}/>
              </div>
              <div className="goal-footer-text">
                ✨ อีก {formatTHB(Math.max(0, monthlyTarget - wonThisMonth))} ถึงเป้า!
              </div>
            </div>

            <div className="user-chip">
              <div className="user-avatar">🦊</div>
              <div className="user-info">
                <div className="user-name">คุณ</div>
                <div className="user-role">Team Lead</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="main-area">
        <header className="app-header">
          <div className="app-header-left">
            {!isDesktop && <button onClick={toggleSidebar}><Menu size={22}/></button>}
            <div>
              <div className="page-title">{titles.title}</div>
              <div className="page-subtitle">{titles.sub}</div>
            </div>
          </div>
          <div className="app-header-right">
            <div className="search-wrap">
              <Search size={16}/>
              <input type="text" placeholder="ค้นหาดีล, ลูกค้า, บริษัท..."
                value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)}/>
              <kbd>⌘K</kbd>
            </div>
            <button className="bell-btn"><Bell size={20}/></button>
          </div>
        </header>
        <div className="main-scroll">
          <Outlet/>
        </div>
      </div>
    </div>
  );
}

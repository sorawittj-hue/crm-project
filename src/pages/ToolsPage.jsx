import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Battery, Server, Laptop, HardDrive, Zap, Shield, Cpu
} from 'lucide-react';
import UPSCalculator from '../components/tools/UPSCalculator';
import RaidCalculator from '../components/tools/RaidCalculator';
import HardwareGuide from '../components/tools/HardwareGuide';

const TOOLS_CONFIG = [
  {
    key: 'ups',
    icon: Battery,
    title: 'UPS Backup Estimator',
    subtitle: 'Determine required VA and Battery Ah',
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'rgba(59,130,246,0.12)',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-600',
    badges: [
      { label: 'VA Calculator', color: 'bg-blue-50 border-blue-100 text-blue-700' },
      { label: 'Battery Config', color: 'bg-amber-50 border-amber-100 text-amber-700' },
    ],
    headerDescription: 'Calculate optimal UPS capacity and battery configuration',
    component: UPSCalculator,
  },
  {
    key: 'raid',
    icon: HardDrive,
    title: 'RAID Efficiency Engine',
    subtitle: 'Calculate usable space vs fault tolerance',
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'rgba(245,158,11,0.12)',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-600',
    badges: [
      { label: 'RAID 0/1/5/6/10', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
      { label: 'Efficiency %', color: 'bg-purple-50 border-purple-100 text-purple-700' },
    ],
    headerDescription: 'Optimize storage capacity with fault tolerance analysis',
    component: RaidCalculator,
  },
  {
    key: 'hardware',
    icon: Laptop,
    title: '2026 Hardware Matrix',
    subtitle: 'Sizing references for PCs, Servers & Networking',
    gradient: 'from-violet-500 to-purple-500',
    bgGlow: 'rgba(139,92,246,0.12)',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    accentText: 'text-violet-600',
    badges: [
      { label: 'Laptops', color: 'bg-violet-50 border-violet-100 text-violet-700' },
      { label: 'Servers', color: 'bg-slate-100 border-slate-200 text-slate-700' },
      { label: 'Network', color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
    ],
    headerDescription: 'Enterprise hardware specifications and procurement guidelines',
    component: HardwareGuide,
  },
];

const FOOTER_STATS = [
  { icon: Cpu, label: 'Hardware Categories', value: '3' },
  { icon: Shield, label: 'RAID Levels', value: '5' },
  { icon: Zap, label: 'Power Factors', value: '0.6–0.9' },
  { icon: Server, label: 'System Voltage', value: '12–96V' },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('ups');

  const activeTool = TOOLS_CONFIG.find((t) => t.key === activeTab);
  const ActiveComponent = activeTool?.component;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1400px] mx-auto pb-20 px-4 md:px-8"
    >
      {/* ── Header ── */}
      <header className="mb-10 mt-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-xl shadow-lg shrink-0">
            <Server size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">
            Hardware Strategy Matrix · 2026 Edition
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Technical{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 bg-clip-text text-transparent italic">
                Laboratory
              </span>
            </h1>
            <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xl">
              Advanced deterministic tools for hardware sizing, RAID calculations, and 2026 IT
              architecture standards. Precision-engineered for enterprise decision-making.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Zap size={16} className="text-amber-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Power Tools</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Shield size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Enterprise Grade</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab List ── */}
      <div className="mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-sm min-w-max">
          {TOOLS_CONFIG.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.key;
            return (
              <button
                key={tool.key}
                onClick={() => setActiveTab(tool.key)}
                className={[
                  'relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap',
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                ].join(' ')}
              >
                <Icon size={14} strokeWidth={2.5} />
                {tool.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Tool Panel ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="rounded-3xl border border-slate-100 shadow-2xl bg-white overflow-hidden"
        >
          {/* Accent top bar */}
          <div className={`h-1.5 bg-gradient-to-r ${activeTool.gradient}`} />

          {/* Tool header */}
          <div className="px-6 py-6 md:px-10 md:py-8 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Icon */}
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${activeTool.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}
              >
                <activeTool.icon size={28} strokeWidth={2} />
              </div>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
                  {activeTool.title}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {activeTool.headerDescription}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {activeTool.badges.map((b) => (
                  <span
                    key={b.label}
                    className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider ${b.color}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tool body */}
          <div className="p-6 md:p-10">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Footer Stats ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {FOOTER_STATS.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0">
              <stat.icon size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

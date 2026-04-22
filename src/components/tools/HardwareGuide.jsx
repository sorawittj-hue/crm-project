import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Laptop, Server, Wifi, Cpu, Monitor, HardDrive, Zap, Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Knowledge Base for 2026 IT Hardware
const HARDWARE_DB = {
  laptop: {
    key: 'laptop',
    icon: Laptop,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    title: "Laptop & Workstations",
    categories: [
      {
        id: 'office',
        label: 'General Office / Admin',
        desc: 'Email, Office 365, Web Apps. Focus on battery life and portability.',
        icon: Laptop,
        specs: {
          cpu: 'Intel Core Ultra 5 (Series 2) or AMD Ryzen AI 5',
          ram: '16GB LPDDR5x',
          storage: '512GB PCIe 4.0 NVMe SSD',
          display: '14" FHD+ IPS or OLED (60Hz)',
          budget: '฿25,000 - ฿35,000'
        }
      },
      {
        id: 'creator',
        label: 'Content Creator / Video Editing',
        desc: 'Adobe CC, DaVinci Resolve, 4K Editing.',
        icon: Monitor,
        specs: {
          cpu: 'Intel Core Ultra 9 / Apple M4 Pro / AMD Ryzen AI 9 HX',
          ram: '32GB - 64GB LPDDR5x',
          storage: '2TB PCIe 5.0 NVMe SSD',
          gpu: 'NVIDIA RTX 5060 / 5070 (8GB+ VRAM)',
          display: '16" 2.5K/4K OLED (100% DCI-P3, 120Hz)',
          budget: '฿65,000 - ฿120,000'
        }
      },
      {
        id: 'cad',
        label: 'CAD & 3D Drafting',
        desc: 'AutoCAD, Revit, SolidWorks. Requires ISV certification.',
        icon: Cpu,
        specs: {
          cpu: 'Intel Core i7/i9 (HX-Series) or AMD Ryzen 9 PRO',
          ram: '32GB DDR5-5600 (ECC optional)',
          storage: '1TB - 2TB PCIe 4.0 NVMe (SED)',
          gpu: 'NVIDIA RTX 2000 / 3000 Ada Generation',
          display: '15.6" - 16" QHD+ IPS (Anti-glare)',
          budget: '฿80,000 - ฿150,000+'
        }
      }
    ]
  },
  server: {
    key: 'server',
    icon: Server,
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-200',
    title: "Enterprise Servers",
    categories: [
      {
        id: 'smb',
        label: 'SMB File & Print / AD Server',
        desc: 'Basic file sharing, Active Directory for 20-50 users.',
        icon: Server,
        specs: {
          form_factor: '1U Rack or Tower Server',
          cpu: 'Intel Xeon E-2400 / AMD EPYC 4004 (4-8 Cores)',
          ram: '32GB - 64GB DDR5 ECC',
          storage: '2x 1.92TB Enterprise SSD / 4x 4TB NLSAS (RAID 1 or 10)',
          network: '2x 10GbE BASE-T',
          budget: '฿80,000 - ฿150,000'
        }
      },
      {
        id: 'virtualization',
        label: 'Virtualization & HCI Node',
        desc: 'Proxmox, VMware ESXi, Hyper-V cluster nodes.',
        icon: HardDrive,
        specs: {
          form_factor: '1U or 2U Rack Server (Dual Socket)',
          cpu: '2x Intel Xeon Scalable Gen 5 or AMD EPYC 9005 (16-32 Cores/CPU)',
          ram: '256GB - 512GB DDR5-5600 ECC RDIMM',
          storage: '4x - 8x 3.84TB NVMe SSD (vSAN/Ceph Ready)',
          network: '2x 25/100GbE SFP28',
          budget: '฿400,000 - ฿800,000+'
        }
      },
      {
        id: 'database',
        label: 'High-Performance Database Server',
        desc: 'SQL Server, Oracle, PostgreSQL. High IOPS required.',
        icon: HardDrive,
        specs: {
          form_factor: '2U Rack Server (NVMe Optimized)',
          cpu: '2x High-Frequency Intel Xeon or AMD EPYC (Focus on clock speed > cores)',
          ram: '512GB - 1TB DDR5-5600 ECC RDIMM',
          storage: 'Hardware RAID + 8x 3.84TB/7.68TB U.2/U.3 NVMe PCIe 5.0 MT/s',
          network: '4x 25GbE SFP28 / 2x 32G FC (SAN connection)',
          budget: '฿900,000 - ฿2,000,000+'
        }
      }
    ]
  },
  network: {
    key: 'network',
    icon: Wifi,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    title: "Networking & WiFi 7",
    categories: [
      {
        id: 'ap',
        label: 'Access Points (Wi-Fi 7)',
        desc: 'High-density office, IEEE 802.11be standard with Multi-Link Operation (MLO).',
        icon: Wifi,
        specs: {
          class: 'Wi-Fi 7 (Tri-Band 2.4/5/6GHz)',
          throughput: 'BE9300 to BE22000 (Aggregate)',
          uplink: '1x 2.5GbE or 10GbE PoE++ (802.3bt)',
          features: 'AI-driven Radio Resource Management, WPA3, 320MHz Channel support',
          recommendation: 'Aruba 700 Series, Cisco Catalyst CW9100, UniFi U7 Enterprise',
          budget: '฿15,000 - ฿45,000 / Unit'
        }
      },
      {
        id: 'switch_access',
        label: 'Access / Edge Switch',
        desc: 'Connecting employee PCs, APs, and IoT devices.',
        icon: Zap,
        specs: {
          ports: '24/48 Ports Multi-Gigabit (1/2.5/5GbE)',
          uplink: '4x 10/25GbE SFP28',
          poe: 'PoE+ (30W) / PoE++ (60W-90W) Total Budget 740W-1440W',
          management: 'L2+ or Light L3, Cloud-managed (SD-Branch)',
          recommendation: 'Aruba CX 6200/6300, Cisco Catalyst 9200/9300, UniFi Pro Max',
          budget: '฿40,000 - ฿150,000 / Unit'
        }
      },
      {
        id: 'switch_core',
        label: 'Core / Distribution Switch',
        desc: 'Datacenter core or building aggregation.',
        icon: Shield,
        specs: {
          ports: '24/48x 10/25GbE SFP28 Fiber',
          uplink: '4/6x 40/100GbE QSFP28',
          features: 'Full L3 Routing (OSPF, BGP), EVPN-VXLAN, Redundant Power Supplies',
          throughput: 'Non-blocking 2.0 Tbps+ Switching Capacity',
          recommendation: 'Aruba CX 8325/8360, Cisco Nexus 9300, FortiSwitch Data Center',
          budget: '฿300,000 - ฿1,000,000+ / Unit'
        }
      }
    ]
  }
};

export default function HardwareGuide() {
  const [activeCategory, setActiveCategory] = useState('laptop');
  const [activeProfile, setActiveProfile] = useState(HARDWARE_DB['laptop'].categories[0].id);

  const currentCategoryDb = HARDWARE_DB[activeCategory];
  const currentProfile = currentCategoryDb.categories.find(c => c.id === activeProfile);

  return (
    <div className="space-y-8">
      {/* Top Level Category Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(HARDWARE_DB).map(([key, data]) => {
          const Icon = data.icon;
          const isActive = activeCategory === key;
          return (
            <motion.button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setActiveProfile(data.categories[0].id);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-3 px-8 h-16 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] border-2 shadow-sm",
                isActive
                  ? `bg-gradient-to-r ${data.gradient} border-transparent text-white shadow-lg`
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
              )}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span>{key}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left Side: Profile Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
              currentCategoryDb.gradient
            )}>
              <currentCategoryDb.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight">{currentCategoryDb.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Select Configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
            {currentCategoryDb.categories.map((profile, idx) => {
              const ProfileIcon = profile.icon;
              const isProfileActive = activeProfile === profile.id;
              return (
                <motion.button
                  key={profile.id}
                  onClick={() => setActiveProfile(profile.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className={cn(
                    "w-full text-left p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 group",
                    isProfileActive
                      ? `bg-gradient-to-br ${currentCategoryDb.bgGradient} ${currentCategoryDb.borderColor} shadow-md`
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start gap-3 md:gap-4 font-inter">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isProfileActive
                        ? `bg-gradient-to-br ${currentCategoryDb.gradient} text-white shadow-md`
                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <ProfileIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] md:text-sm font-black text-slate-900 mb-1 leading-snug">{profile.label}</h3>
                      <p className="text-[10px] md:text-[11px] font-bold text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-none">{profile.desc}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Specification Details */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white rounded-3xl md:rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden"
            >
              {/* Header Banner */}
              <div className={cn(
                "p-6 md:p-10",
                `bg-gradient-to-br ${currentCategoryDb.bgGradient}`
              )}>
                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                  <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl",
                    currentCategoryDb.gradient
                  )}>
                    <currentCategoryDb.icon size={36} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                      <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{currentProfile.label}</h2>
                    </div>
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <span className={cn(
                        "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em]",
                        `bg-gradient-to-r ${currentCategoryDb.gradient} text-white shadow-sm`
                      )}>
                        2026 Recommended Benchmark
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-bold text-slate-600 leading-relaxed">{currentProfile.desc}</p>
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="p-6 md:p-10">
                <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                  {Object.entries(currentProfile.specs).map(([specKey, specValue], idx) => (
                    <motion.div
                      key={specKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className={cn(
                        "p-4 md:p-5 rounded-2xl border transition-all duration-300",
                        specKey === 'budget'
                          ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 col-span-full md:col-span-1"
                          : "bg-slate-50 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 md:mb-2.5">
                        {specKey.replace(/_/g, ' ')}
                      </p>
                      <p className={cn(
                        "text-xs md:text-sm font-bold leading-snug",
                        specKey === 'budget' ? "text-emerald-700 text-base md:text-lg font-black tracking-tight" : "text-slate-900"
                      )}>
                        {specValue}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 md:mt-8 p-4 md:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Procurement Note</p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 leading-relaxed">
                      Prices are estimated street prices in Thailand (THB). Actual pricing may vary based on vendor, volume, and warranty terms. Contact authorized distributors for enterprise quotes.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

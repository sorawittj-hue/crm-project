import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Laptop, Server, Wifi
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Knowledge Base for 2026 IT Hardware
const HARDWARE_DB = {
  laptop: {
    icon: <Laptop size={24} />,
    title: "Laptop & Workstations (2026 Standards)",
    categories: [
      {
        id: 'office',
        label: 'General Office / Admin',
        desc: 'Email, Office 365, Web Apps. Focus on battery life and portability.',
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
    icon: <Server size={24} />,
    title: "Enterprise Servers (2026 Architecture)",
    categories: [
      {
        id: 'smb',
        label: 'SMB File & Print / AD Server',
        desc: 'Basic file sharing, Active Directory for 20-50 users.',
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
        specs: {
          form_factor: '1U or 2U Rack Server (Dual Socket)',
          cpu: '2x Intel Xeon Scalable Gen 5 or AMD EPYC 9005 (16-32 Cores/CPU)',
          ram: '256GB - 512GB DDR5-5600 ECC RDIMM',
          storage: '4x - 8x 3.84TB NVMe SSD (vSAN/Ceph Ready)',
          network: '2x 25/100GbE SFP28/QSFP28',
          budget: '฿400,000 - ฿800,000+'
        }
      },
      {
        id: 'database',
        label: 'High-Performance Database Server',
        desc: 'SQL Server, Oracle, PostgreSQL. High IOPS required.',
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
    icon: <Wifi size={24} />,
    title: "Networking & WiFi 7 Standard (2026)",
    categories: [
      {
        id: 'ap',
        label: 'Access Points (Wi-Fi 7)',
        desc: 'High-density office, IEEE 802.11be standard with Multi-Link Operation (MLO).',
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
    <div className="space-y-6">
      
      {/* Top Level Category Selector */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(HARDWARE_DB).map(([key, data]) => (
          <button
            key={key}
            onClick={() => {
              setActiveCategory(key);
              setActiveProfile(data.categories[0].id);
            }}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-3 px-8 h-14 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] border",
              activeCategory === key 
                ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
            )}
          >
            {data.icon}
            <span>{key} Guide</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-12 gap-6 mt-8">
        {/* Left Side: Profile Lists */}
        <div className="md:col-span-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-4">Select Target Profile</p>
          {currentCategoryDb.categories.map((profile) => (
             <button
                key={profile.id}
                onClick={() => setActiveProfile(profile.id)}
                className={cn(
                  "w-full text-left p-6 rounded-[2rem] border transition-all duration-300",
                  activeProfile === profile.id 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 opacity-60 hover:opacity-100"
                )}
             >
                <h3 className="text-sm font-black text-slate-900 mb-2">{profile.label}</h3>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed line-clamp-2">{profile.desc}</p>
             </button>
          ))}
        </div>

        {/* Right Side: Specification Details */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
             <motion.div
               key={currentProfile.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-12"
             >
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shrink-0">
                       {currentCategoryDb.icon}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{currentProfile.label}</h2>
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">2026 Recommended Benchmark</p>
                    </div>
                 </div>

                 <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-2xl mb-10 pb-10 border-b border-slate-100">
                    {currentProfile.desc}
                 </p>

                 <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(currentProfile.specs).map(([specKey, specValue]) => (
                       <div key={specKey} className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{specKey.replace('_', ' ')}</p>
                          <p className={cn(
                             "text-sm font-bold leading-snug", 
                             specKey === 'budget' ? "text-primary text-xl font-black tracking-tight" : "text-slate-900"
                          )}>
                            {specValue}
                          </p>
                       </div>
                    ))}
                 </div>
             </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

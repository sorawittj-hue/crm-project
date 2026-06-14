import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Laptop, Server, Wifi, Cpu, Monitor, HardDrive, Zap, Shield, Lightbulb, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Knowledge Base for Mid-2026 IT Hardware
const HARDWARE_DB = {
  laptop: {
    key: 'laptop',
    icon: Laptop,
    gradient: 'from-blue-600 to-cyan-500',
    bgGradient: 'from-blue-50/40 to-cyan-50/40',
    borderColor: 'border-blue-200/50',
    title: "Laptops & Workstations (AI PCs)",
    categories: [
      {
        id: 'office',
        label: 'General Office & Executive',
        desc: 'เน้นแบตเตอรี่อึด น้ำหนักเบา สำหรับงานเอกสารและประชุมออนไลน์',
        icon: Laptop,
        specs: {
          cpu: 'Intel Core Ultra 5/7 (Series 3) หรือ Snapdragon X Elite (v2)',
          ram: '16GB - 32GB LPCAMM2',
          storage: '512GB - 1TB PCIe 4.0 NVMe',
          display: '14" FHD+ หรือ 2.8K OLED (90Hz+)',
          budget: '฿30,000 - ฿45,000'
        },
        proTip: 'ปี 2026 ระบบ Windows AI Copilot กินแรมเพิ่มขึ้น แนะนำให้เริ่มที่ 16GB LPCAMM2 เพื่อความลื่นไหลและประหยัดพลังงานมากกว่า SO-DIMM'
      },
      {
        id: 'creator',
        label: 'Content Creator / Video Editing',
        desc: 'งานตัดต่อวิดีโอ 4K+, กราฟิก 3D และเรนเดอร์',
        icon: Monitor,
        specs: {
          cpu: 'Apple M5 Pro/Max หรือ AMD Ryzen AI 9 HX 370',
          ram: '32GB - 64GB LPDDR5x-7500',
          storage: '2TB PCIe 5.0 NVMe SSD',
          gpu: 'NVIDIA RTX 5070 (Blackwell) 12GB VRAM',
          display: '16" 3.2K/4K Mini-LED หรือ OLED (120Hz)',
          budget: '฿70,000 - ฿130,000'
        },
        proTip: 'ชิปกราฟิก RTX 50-series (Blackwell) ให้ประสิทธิภาพสูงกว่ารุ่นเก่า 30% และมี VRAM เพียงพอสำหรับการรัน Local AI Model บนเครื่อง'
      },
      {
        id: 'cad',
        label: 'CAD, Engineering & Data Science',
        desc: 'โปรแกรม AutoCAD, SolidWorks, การเทรน ML ขนาดเล็ก',
        icon: Cpu,
        specs: {
          cpu: 'Intel Core i9 (15th/16th Gen HX) หรือ AMD Ryzen 9 9900HX',
          ram: '64GB DDR5-6400 (รองรับ ECC)',
          storage: '2TB PCIe 5.0 NVMe (SED Security)',
          gpu: 'NVIDIA RTX 3000 / 4000 Ada Generation',
          display: '16" UHD+ IPS (Anti-glare, ISV Certified)',
          budget: '฿90,000 - ฿180,000+'
        },
        proTip: 'กลุ่มงานวิศวกรรมยังจำเป็นต้องใช้การ์ดจอฝั่ง Workstation (Ada Generation) เพื่อให้ได้ ISV Certification การันตีความเสถียรในการเรนเดอร์พาร์ทนับหมื่นชิ้น'
      }
    ]
  },
  server: {
    key: 'server',
    icon: Server,
    gradient: 'from-violet-600 to-purple-500',
    bgGradient: 'from-violet-50/40 to-purple-50/40',
    borderColor: 'border-violet-200/50',
    title: "Enterprise Servers & Datacenter",
    categories: [
      {
        id: 'virtualization',
        label: 'Virtualization & HCI Node',
        desc: 'รองรับ VMware, Proxmox, Nutanix Clusters',
        icon: HardDrive,
        specs: {
          form_factor: '1U / 2U Rack Server (Dual Socket)',
          cpu: '2x AMD EPYC 9005 (Turin) หรือ Intel Xeon 6 (Granite Rapids)',
          ram: '384GB - 768GB DDR5-6400 ECC RDIMM',
          storage: '4x - 8x 3.84TB E3.S NVMe SSDs',
          network: '2x 25/100GbE SFP28/QSFP28',
          budget: '฿500,000 - ฿1,000,000+'
        },
        proTip: 'ฟอร์มแฟคเตอร์ E3.S NVMe เป็นมาตรฐานใหม่แทนที่ U.2 ในปี 2026 ระบายความร้อนดีกว่า และดึงประสิทธิภาพ PCIe 5.0 ได้เต็มที่'
      },
      {
        id: 'ai_training',
        label: 'AI Training & Big Data Node',
        desc: 'เซิร์ฟเวอร์เฉพาะทางสำหรับฝึกสอน AI องค์กร และประมวลผลข้อมูลมหาศาล',
        icon: Cpu,
        specs: {
          form_factor: '4U / 8U GPU Server',
          cpu: '2x High-Frequency Intel Xeon 6 หรือ AMD EPYC 9005',
          ram: '1TB - 2TB DDR5-6400 ECC',
          storage: '8x 7.68TB E3.S NVMe PCIe 5.0',
          gpu: '4x ถึง 8x NVIDIA H200 หรือ B100 Tensor Core GPUs',
          network: '4x 400GbE OSFP (NVIDIA Quantum-2 InfiniBand)',
          budget: '฿3,500,000 - ฿10,000,000+'
        },
        proTip: 'ชิป B100 (Blackwell) ให้ประสิทธิภาพเทรน AI สูงกว่า H100 อย่างก้าวกระโดด ควรเตรียมเรื่องระบบหล่อเย็น (Liquid Cooling) ไว้ล่วงหน้าหากดาต้าเซ็นเตอร์รองรับไหว'
      },
      {
        id: 'smb',
        label: 'SMB File & Print / Edge Server',
        desc: 'สำหรับออฟฟิศสาขา หรือธุรกิจขนาดเล็ก',
        icon: Server,
        specs: {
          form_factor: '1U Rack หรือ Tower',
          cpu: 'Intel Xeon E-2400 (Gen 2) หรือ AMD EPYC 4004',
          ram: '64GB DDR5 ECC',
          storage: '2x 1.92TB Enterprise NVMe (RAID 1)',
          network: '2x 10GbE BASE-T หรือ 25GbE',
          budget: '฿100,000 - ฿180,000'
        },
        proTip: 'ในปัจจุบัน SSD แบบ NVMe ราคาลงมาใกล้เคียงกับ SATA มากแล้ว ไม่มีเหตุผลที่จะใช้ฮาร์ดดิสก์จานหมุนอีกต่อไปยกเว้นจะเป็น Cold Storage'
      }
    ]
  },
  network: {
    key: 'network',
    icon: Wifi,
    gradient: 'from-emerald-600 to-teal-500',
    bgGradient: 'from-emerald-50/40 to-teal-50/40',
    borderColor: 'border-emerald-200/50',
    title: "Networking (Wi-Fi 7 & Multi-Gig)",
    categories: [
      {
        id: 'ap',
        label: 'Wi-Fi 7 Access Points',
        desc: 'กระจายสัญญาณความเร็วสูง ทะลุทะลวง รองรับคนหนาแน่น',
        icon: Wifi,
        specs: {
          class: 'Wi-Fi 7 (Tri-Band 2.4/5/6GHz)',
          throughput: 'BE11000 - BE22000 (Aggregate)',
          uplink: '1x 2.5GbE / 5GbE / 10GbE PoE++ (802.3bt)',
          features: 'Multi-Link Operation (MLO), 320MHz Channels',
          recommendation: 'Aruba 700 Series, Cisco Catalyst CW9100, UniFi U7 Enterprise',
          budget: '฿20,000 - ฿50,000 / ยูนิต'
        },
        proTip: 'Wi-Fi 7 บังคับใช้ช่องสัญญาณ 320MHz ในย่าน 6GHz และ MLO จะรวมความเร็วหลายคลื่นเข้าด้วยกัน ทำให้อุปกรณ์ Client ได้สปีดทะลุ 2-3 Gbps ได้สบายๆ'
      },
      {
        id: 'switch_access',
        label: 'Multi-Gig Access / Edge Switch',
        desc: 'เชื่อมต่อพนักงานและจุดกระจายสัญญาณไร้สาย',
        icon: Zap,
        specs: {
          ports: '24/48x 2.5GbE / 5GbE / 10GbE',
          uplink: '4x 25GbE / 50GbE SFP28/56',
          poe: 'PoE++ (60W-90W) งบพลังงานรวม 1440W+',
          management: 'L2+ หรือ L3, Cloud-managed',
          recommendation: 'Aruba CX 6300M, Cisco Catalyst 9300X, UniFi Pro Max 48 PoE',
          budget: '฿80,000 - ฿250,000 / ยูนิต'
        },
        proTip: 'พอร์ต 1Gbps เดิม (Gigabit) คอขวดแน่นอนสำหรับ Wi-Fi 7 Switch ยุคปี 2026 ต้องยืนพื้นพอร์ตลูกข่ายที่ 2.5GbE เป็นขั้นต่ำสุด'
      },
      {
        id: 'firewall',
        label: 'Next-Gen Firewall (NGFW)',
        desc: 'รักษาความปลอดภัยเกตเวย์ ป้องกัน Ransomware และ AI Threats',
        icon: Shield,
        specs: {
          throughput: 'Threat Protection 5Gbps+',
          interfaces: '4x 10/25GbE SFP28, 8x 2.5GbE RJ45',
          features: 'AI-Powered Deep Packet Inspection, Zero Trust Network Access (ZTNA)',
          recommendation: 'FortiGate 90G/120G, Palo Alto PA-400 Series',
          budget: '฿150,000 - ฿400,000+ (รวม License)'
        },
        proTip: 'ไฟร์วอลล์ยุคใหม่นำ AI มาใช้ตรวจจับพฤติกรรมผิดปกติแบบ Zero-day และทำงานควบคู่กับ ZTNA ทดแทน VPN แบบดั้งเดิมที่เสี่ยงต่อการถูกเจาะระบบ'
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
    <div className="space-y-8 relative">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-20 w-96 h-96 bg-violet-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Level Category Selector */}
      <div className="flex flex-wrap gap-3 mb-8 relative z-10">
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
                "flex-1 md:flex-none flex items-center justify-center gap-3 px-8 h-16 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-[0.2em] border shadow-sm",
                isActive
                  ? `bg-gradient-to-r ${data.gradient} border-transparent text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] ring-1 ring-white/20`
                  : "bg-white/80 backdrop-blur-xl border-white/80 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
              )}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span>{key}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 md:gap-8 relative z-10">
        {/* Left Side: Profile Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-4 md:mb-6 px-1">
            <div className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-1 ring-white/30",
              currentCategoryDb.gradient
            )}>
              <currentCategoryDb.icon size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{currentCategoryDb.title}</h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Select Configuration</p>
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
                    "w-full text-left p-4 md:p-5 rounded-[1.5rem] border transition-all duration-300 group overflow-hidden relative",
                    isProfileActive
                      ? `bg-gradient-to-br ${currentCategoryDb.bgGradient} ${currentCategoryDb.borderColor} shadow-[0_8px_30px_rgb(0,0,0,0.06)]`
                      : "bg-white/70 backdrop-blur-xl border-white/80 hover:border-slate-200 hover:shadow-md shadow-sm"
                  )}
                >
                  {isProfileActive && (
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite] skew-x-12" />
                  )}
                  <div className="flex items-start gap-3 md:gap-4 font-inter relative z-10">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isProfileActive
                        ? `bg-gradient-to-br ${currentCategoryDb.gradient} text-white shadow-md`
                        : "bg-slate-100/80 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <ProfileIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-[13px] md:text-sm font-black mb-1 leading-snug transition-colors", isProfileActive ? "text-slate-900" : "text-slate-700")}>{profile.label}</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-none">{profile.desc}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Spec Sheet */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 p-6 md:p-10 shadow-[0_20px_60px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/5 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <currentProfile.icon size={120} />
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 md:mb-3 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full bg-gradient-to-br", currentCategoryDb.gradient)} />
                    Recommended Specs 2026
                  </h4>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-6 md:mb-8">{currentProfile.label}</h2>

                  {/* Specs List */}
                  <div className="space-y-3 md:space-y-4 flex-1">
                    {Object.entries(currentProfile.specs).map(([specKey, specValue], i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={specKey} 
                        className="flex flex-col sm:flex-row sm:items-center py-2.5 md:py-3 border-b border-slate-100 last:border-0 group"
                      >
                        <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest sm:w-1/3 mb-1 sm:mb-0 shrink-0">
                          {specKey.replace('_', ' ')}
                        </span>
                        <span className="text-xs md:text-sm font-semibold text-slate-800 sm:w-2/3 group-hover:text-slate-900 transition-colors">
                          {specValue}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pro Tip Box */}
                  {currentProfile.proTip && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={cn(
                        "mt-8 p-5 md:p-6 rounded-3xl border shadow-sm relative overflow-hidden",
                        `${currentCategoryDb.bgGradient} ${currentCategoryDb.borderColor}`
                      )}
                    >
                      <div className="absolute -top-6 -right-6 text-current opacity-[0.05]">
                        <Lightbulb size={100} />
                      </div>
                      <div className="flex gap-4 relative z-10">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-white/60",
                          `text-${currentCategoryDb.gradient.split(' ')[0].replace('from-', '')}`
                        )}>
                          <Lightbulb size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            Pro Tip 💡
                          </h5>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            {currentProfile.proTip}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

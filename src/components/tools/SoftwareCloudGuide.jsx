import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, ShieldCheck, DatabaseBackup, Box, Lightbulb, ServerCog
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Knowledge Base for Mid-2026 Software & Cloud
const SOFTWARE_DB = {
  cloud: {
    key: 'cloud',
    icon: Cloud,
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50/40 to-amber-50/40',
    borderColor: 'border-orange-200/50',
    title: "Cloud Infrastructure (AWS / Azure)",
    categories: [
      {
        id: 'aws_ec2',
        label: 'AWS EC2 & Serverless',
        desc: 'การแนะนำบริการประมวลผลบนคลาวด์สำหรับองค์กร',
        icon: Cloud,
        specs: {
          compute: 'Graviton 4 (ARM) ให้ความคุ้มค่าสูงสุดสำหรับ Web/App Server',
          storage: 'EBS gp3 (มาตรฐาน) หรือ io2 สำหรับ Database',
          scaling: 'Auto Scaling Groups + Application Load Balancer',
          cost_optimization: 'Savings Plans 1-3 ปี (ลดต้นทุนสูงสุด 72%)'
        },
        proTip: 'ในปี 2026 การใช้ชิป ARM อย่าง AWS Graviton 4 ได้รับความนิยมสูงมาก เพราะประหยัดค่าใช้จ่ายกว่า x86 ถึง 30% โดยประสิทธิภาพดีกว่า แนะนำให้ลูกค้า Migrate ถ้าแอปพลิเคชันรองรับ'
      },
      {
        id: 'azure_hybrid',
        label: 'Azure Hybrid Cloud',
        desc: 'สำหรับองค์กรที่ใช้ Microsoft Environment เป็นหลัก',
        icon: ServerCog,
        specs: {
          compute: 'Azure Virtual Machines (D-series v5)',
          identity: 'Entra ID (ชื่อเดิม Azure AD) P1/P2',
          hybrid: 'Azure Arc สำหรับจัดการ On-Premise',
          benefits: 'Azure Hybrid Benefit (นำ License Windows Server On-prem มาใช้ลดราคาคลาวด์)'
        },
        proTip: 'ลูกค้าที่ต่อ SA (Software Assurance) ของ Windows Server อยู่แล้ว สามารถใช้สิทธิ์ Hybrid Benefit ลดค่าเช่า VM บน Azure ได้เกือบครึ่ง! เป็นจุดขายสำคัญสำหรับลูกค้า Enterprise'
      }
    ]
  },
  cybersecurity: {
    key: 'cybersecurity',
    icon: ShieldCheck,
    gradient: 'from-rose-500 to-pink-600',
    bgGradient: 'from-rose-50/40 to-pink-50/40',
    borderColor: 'border-rose-200/50',
    title: "Cybersecurity (EDR & ZTNA)",
    categories: [
      {
        id: 'edr',
        label: 'Endpoint Detection & Response (EDR)',
        desc: 'ระบบป้องกันไวรัสและภัยคุกคามยุคใหม่ระดับ Endpoint',
        icon: ShieldCheck,
        specs: {
          technology: 'AI Behavior-Based Analysis (ไม่ใช่แค่สแกน Signature)',
          features: 'Automated Remediation, Network Isolation',
          recommendation: 'CrowdStrike Falcon, SentinelOne Singularity',
          budget: '฿1,500 - ฿3,500 / เครื่อง / ปี'
        },
        proTip: 'ในปี 2026 Anti-Virus แบบดั้งเดิม (Signature-based) ป้องกัน Ransomware รุ่นใหม่ไม่ได้แล้ว ต้องขายโซลูชันที่เป็น EDR/XDR เท่านั้น ซึ่งจะใช้ AI ตรวจจับพฤติกรรมผิดปกติและตัดการเชื่อมต่ออัตโนมัติ'
      },
      {
        id: 'zero_trust',
        label: 'Zero Trust Network Access (ZTNA)',
        desc: 'ทดแทน VPN แบบเก่า เพิ่มความปลอดภัยในการ Work from Anywhere',
        icon: Box,
        specs: {
          concept: 'Never Trust, Always Verify',
          features: 'Identity-based Access, Device Posture Check',
          recommendation: 'Zscaler ZPA, Cloudflare Access, FortiSASE',
          deployment: 'Agent-based หรือ Clientless'
        },
        proTip: 'VPN ถือเป็นช่องโหว่ยอดฮิตของการถูกแฮ็ก ZTNA จะไม่เปิดให้ User เห็นเน็ตเวิร์กทั้งวง แต่จะเจาะจงให้เข้าถึงเฉพาะแอปพลิเคชันที่ได้รับสิทธิ์เท่านั้น'
      }
    ]
  },
  backup: {
    key: 'backup',
    icon: DatabaseBackup,
    gradient: 'from-blue-600 to-indigo-600',
    bgGradient: 'from-blue-50/40 to-indigo-50/40',
    borderColor: 'border-blue-200/50',
    title: "Data Backup & Recovery",
    categories: [
      {
        id: 'enterprise_backup',
        label: 'Enterprise Backup & Replication',
        desc: 'ระบบสำรองข้อมูลสำหรับ Virtual Machine และ Physical Server',
        icon: DatabaseBackup,
        specs: {
          strategy: 'กฎ 3-2-1-1-0 (3 Copies, 2 Media, 1 Offsite, 1 Air-gapped/Immutable, 0 Errors)',
          features: 'Instant VM Recovery, Continuous Data Protection (CDP)',
          recommendation: 'Veeam Backup & Replication, Nakivo',
          storage_target: 'NAS On-premise + Cloud S3 (Wasabi / AWS S3)'
        },
        proTip: 'สิ่งสำคัญที่สุดในการนำเสนอ Backup คือฟีเจอร์ "Immutable Storage (เขียนทับ/ลบไม่ได้)" ป้องกันกรณีแฮ็กเกอร์ได้สิทธิ์ Admin แล้วพยายามเข้าไปลบไฟล์ Backup ทิ้ง'
      },
      {
        id: 'm365_backup',
        label: 'Microsoft 365 / Workspace Backup',
        desc: 'สำรองข้อมูล Cloud-to-Cloud สำหรับอีเมลและไดรฟ์',
        icon: Cloud,
        specs: {
          coverage: 'Exchange Online, SharePoint, OneDrive, Teams',
          retention: 'Unlimited Retention (ขึ้นอยู่กับ Plan)',
          recommendation: 'Veeam Backup for M365, Acronis Cyber Protect',
          budget: '฿800 - ฿1,500 / User / ปี'
        },
        proTip: 'ลูกค้ามักเข้าใจผิดว่า Microsoft สำรองข้อมูลให้ตลอดกาล แต่จริงๆ นโยบาย Shared Responsibility ระบุว่าลูกค้าต้องดูแล Data เอง แนะนำให้ขายแนบไปกับทุกดีล M365'
      }
    ]
  },
  virtualization: {
    key: 'virtualization',
    icon: Box,
    gradient: 'from-purple-600 to-fuchsia-600',
    bgGradient: 'from-purple-50/40 to-fuchsia-50/40',
    borderColor: 'border-purple-200/50',
    title: "Virtualization (VM & HCI)",
    categories: [
      {
        id: 'hypervisor',
        label: 'Enterprise Hypervisor',
        desc: 'ระบบปฏิบัติการสำหรับแบ่งทรัพยากรเซิร์ฟเวอร์',
        icon: Box,
        specs: {
          options: 'Proxmox VE, Microsoft Hyper-V, VMware vSphere',
          features: 'Live Migration, High Availability (HA), Distributed Switch',
          storage: 'vSAN หรือ Ceph (สำหรับ HCI)'
        },
        proTip: 'หลังจากดีล Broadcom ซื้อ VMware ทำให้ไลเซนส์แพงขึ้นหลายเท่าตัว ในปี 2026 ลูกค้า SMB/Mid-Market นิยมย้าย (Migrate) ไประบบ Open-Source อย่าง Proxmox VE มากขึ้น ถือเป็นโอกาสทองในการขาย Service ติดตั้งและย้ายระบบ'
      }
    ]
  }
};

export default function SoftwareCloudGuide() {
  const [activeCategory, setActiveCategory] = useState('cloud');
  const [activeProfile, setActiveProfile] = useState(SOFTWARE_DB['cloud'].categories[0].id);

  const currentCategoryDb = SOFTWARE_DB[activeCategory];
  const currentProfile = currentCategoryDb.categories.find(c => c.id === activeProfile);

  return (
    <div className="space-y-8 relative">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-20 w-96 h-96 bg-orange-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-rose-400/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Level Category Selector */}
      <div className="flex flex-wrap gap-3 mb-8 relative z-10">
        {Object.entries(SOFTWARE_DB).map(([key, data]) => {
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
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Select Software/Solution</p>
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
                    Recommended Architecture 2026
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

import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { motion } from 'framer-motion';
import {
  Battery, Server, Laptop, HardDrive
} from 'lucide-react';
import UPSCalculator from '../components/tools/UPSCalculator';
import RaidCalculator from '../components/tools/RaidCalculator';
import HardwareGuide from '../components/tools/HardwareGuide';

// Removed old rule engine / generator components.
// (LogicProtocolGenerator, SystemHealthAnalyzer, ROICalculator)

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('ups');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1400px] mx-auto space-y-12 pb-20 px-4 md:px-0">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-xl"><Server size={18} /></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Hardware Strategy Matrix (2026 Definitions)</p>
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
          Technical <span className="text-primary italic">Lab</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Advanced deterministic tools for hardware sizing, RAID calculations, and 2026 IT architecture standards.</p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
        <TabsList className="bg-white border border-slate-100 p-2 rounded-[2rem] inline-flex flex-wrap h-auto gap-2">
          <TabsTrigger value="ups" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">UPS Backup Estimator</TabsTrigger>
          <TabsTrigger value="raid" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">RAID Storage Core</TabsTrigger>
          <TabsTrigger value="hardware" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">2026 Hardware Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="ups" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Battery size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">UPS Backup Estimator</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Determine required VA and Battery Ah</p>
               </div>
            </div>
            <UPSCalculator />
          </Card>
        </TabsContent>

        <TabsContent value="raid" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm"><HardDrive size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">RAID Efficiency Engine</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Calculate usable space vs fault tolerance</p>
               </div>
            </div>
            <RaidCalculator />
          </Card>
        </TabsContent>

        <TabsContent value="hardware" className="mt-0">
          <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
               <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm"><Laptop size={28} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">2026 Hardware Matrix</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Sizing references for PCs, Servers, and Networking</p>
               </div>
            </div>
            <HardwareGuide />
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

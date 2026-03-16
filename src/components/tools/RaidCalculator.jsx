import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { HardDrive, Server, Shield } from 'lucide-react';

const RAID_TYPES = [
  { id: '0', title: 'RAID 0', minDrives: 2, faultTol: 0, read: 'Fast', write: 'Fast' },
  { id: '1', title: 'RAID 1', minDrives: 2, faultTol: 1, read: 'Fast', write: 'Normal' },
  { id: '5', title: 'RAID 5', minDrives: 3, faultTol: 1, read: 'Fast', write: 'Normal' },
  { id: '6', title: 'RAID 6', minDrives: 4, faultTol: 2, read: 'Fast', write: 'Normal' },
  { id: '10', title: 'RAID 10', minDrives: 4, faultTol: 1, read: 'Very Fast', write: 'Fast' }
];

export default function RaidCalculator() {
  const [inputs, setInputs] = useState({ 
    driveCapacityGB: '1000', 
    numberOfDrives: '4',
    raidType: '5'
  });
  
  const [results, setResults] = useState(null);

  const calculate = () => {
    const capacity = Number(inputs.driveCapacityGB) || 0;
    const drives = Number(inputs.numberOfDrives) || 0;
    const raidId = inputs.raidType;

    const raidTypeData = RAID_TYPES.find(r => r.id === raidId);
    
    if (drives < raidTypeData.minDrives) {
      alert(`RAID ${raidId} requires at least ${raidTypeData.minDrives} drives.`);
      return;
    }

    let usableCapacity = 0;
    let faultTolerance = raidTypeData.faultTol;

    switch (raidId) {
      case '0': usableCapacity = capacity * drives; break;
      case '1': usableCapacity = capacity; break;
      case '5': usableCapacity = capacity * (drives - 1); break;
      case '6': usableCapacity = capacity * (drives - 2); break;
      case '10': usableCapacity = capacity * (drives / 2); faultTolerance = drives / 2; break; // Simplified FT
      default: break;
    }

    setResults({
      usableCapacity,
      totalRawCapacity: capacity * drives,
      faultTolerance,
      storageEfficiency: ((usableCapacity / (capacity * drives)) * 100).toFixed(1),
      raidInfo: raidTypeData
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drive Capacity</label>
          <div className="relative flex items-center">
             <Input 
               type="number" 
               placeholder="1000" 
               value={inputs.driveCapacityGB} 
               onChange={(e) => setInputs({ ...inputs, driveCapacityGB: e.target.value })} 
               className="rounded-xl border-slate-200 h-12 pr-12 w-full" 
             />
             <span className="absolute right-4 text-[10px] font-black text-slate-400">GB</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number of Drives</label>
          <Input 
            type="number" 
            placeholder="4" 
            value={inputs.numberOfDrives} 
            onChange={(e) => setInputs({ ...inputs, numberOfDrives: e.target.value })} 
            className="rounded-xl border-slate-200 h-12" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RAID Level</label>
          <select 
            value={inputs.raidType} 
            onChange={(e) => setInputs({ ...inputs, raidType: e.target.value })} 
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none border-0 ring-1 ring-slate-200 cursor-pointer"
          >
            {RAID_TYPES.map(r => (
               <option key={r.id} value={r.id}>{r.title} (Min: {r.minDrives} Drives)</option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.01] transition-all">
        <Server size={16} className="mr-2" /> Calculate Array
      </Button>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center text-center">
                 <HardDrive size={24} className="text-emerald-500 mb-2" />
                 <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Usable Capacity</p>
                 <p className="text-2xl font-black text-slate-900 leading-none tabular-nums mt-1">{results.usableCapacity} <span className="text-xs text-slate-400">GB</span></p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                 <Server size={24} className="text-slate-400 mb-2" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Raw Capacity</p>
                 <p className="text-2xl font-black text-slate-900 leading-none tabular-nums mt-1">{results.totalRawCapacity} <span className="text-xs text-slate-400">GB</span></p>
              </div>
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center text-center">
                 <Shield size={24} className="text-amber-500 mb-2" />
                 <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest leading-none mb-1">Fault Tolerance</p>
                 <p className="text-2xl font-black text-slate-900 leading-none tabular-nums mt-1">{results.faultTolerance} <span className="text-xs text-slate-400">Drive(s)</span></p>
              </div>
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
                 <div className="text-xl font-black text-primary mb-2 leading-none">{results.storageEfficiency}%</div>
                 <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Storage Efficiency</p>
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

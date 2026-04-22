import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { HardDrive, Server, Shield, Database, Layers, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const RAID_TYPES = [
  { id: '0', title: 'RAID 0', minDrives: 2, faultTol: 0, read: 'Fast', write: 'Fast', color: 'blue', description: 'Striping, no redundancy' },
  { id: '1', title: 'RAID 1', minDrives: 2, faultTol: 1, read: 'Fast', write: 'Normal', color: 'green', description: 'Mirroring, excellent redundancy' },
  { id: '5', title: 'RAID 5', minDrives: 3, faultTol: 1, read: 'Fast', write: 'Normal', color: 'purple', description: 'Striping with distributed parity' },
  { id: '6', title: 'RAID 6', minDrives: 4, faultTol: 2, read: 'Fast', write: 'Normal', color: 'amber', description: 'Dual parity, high fault tolerance' },
  { id: '10', title: 'RAID 10', minDrives: 4, faultTol: 1, read: 'Very Fast', write: 'Fast', color: 'emerald', description: 'Mirrored stripes, best performance' }
];

const RAID_COLORS = {
  blue: { bg: 'from-blue-500 to-cyan-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  green: { bg: 'from-emerald-500 to-green-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  purple: { bg: 'from-purple-500 to-violet-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  amber: { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  emerald: { bg: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' }
};

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
      case '10': usableCapacity = capacity * (drives / 2); faultTolerance = drives / 2; break;
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

  const inputClasses = cn(
    "flex h-14 w-full rounded-2xl border-2 bg-white px-5 py-3 text-base font-bold outline-none transition-all duration-200",
    "border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
  );

  const labelClasses = "text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2";

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <Database size={12} strokeWidth={3} />
            Drive Capacity
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="1000"
              value={inputs.driveCapacityGB}
              onChange={(e) => setInputs({ ...inputs, driveCapacityGB: e.target.value })}
              className={cn(inputClasses, "pr-16")}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">GB</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 pl-1">Capacity per drive</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <Layers size={12} strokeWidth={3} />
            Number of Drives
          </label>
          <Input
            type="number"
            placeholder="4"
            value={inputs.numberOfDrives}
            onChange={(e) => setInputs({ ...inputs, numberOfDrives: e.target.value })}
            className={inputClasses}
          />
          <p className="text-[10px] font-bold text-slate-400 pl-1">Total drives in array</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <HardDrive size={12} strokeWidth={3} />
            RAID Level
          </label>
          <select
            value={inputs.raidType}
            onChange={(e) => setInputs({ ...inputs, raidType: e.target.value })}
            className={cn(inputClasses, "cursor-pointer")}
          >
            {RAID_TYPES.map(r => (
              <option key={r.id} value={r.id}>{r.title} - {r.description}</option>
            ))}
          </select>
          <p className="text-[10px] font-bold text-slate-400 pl-1">Select RAID configuration</p>
        </motion.div>
      </div>

      {/* Calculate Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={calculate}
          className={cn(
            "w-full h-14 md:h-16 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.25em] shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:scale-[1.02] hover:shadow-2xl active:scale-95"
          )}
        >
          <Server size={18} className="mr-3 shrink-0" />
          Calculate Array Configuration
        </Button>
      </motion.div>

      {/* Results Section */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="mt-8"
        >
          {/* RAID Info Banner */}
          <div className={cn(
            "p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 mb-6 flex flex-col md:flex-row items-center justify-between gap-4",
            RAID_COLORS[results.raidInfo.color].light,
            RAID_COLORS[results.raidInfo.color].border
          )}>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0",
                RAID_COLORS[results.raidInfo.color].bg
              )}>
                <HardDrive size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{results.raidInfo.title}</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">{results.raidInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t border-black/5 md:border-none pt-4 md:pt-0">
              <div className="text-left md:text-right">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Read Speed</p>
                <p className="text-xs md:text-sm font-black text-slate-700">{results.raidInfo.read}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Write Speed</p>
                <p className="text-xs md:text-sm font-black text-slate-700">{results.raidInfo.write}</p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Usable Capacity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-[3rem] -z-0" />
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mx-auto mb-3">
                  <Database size={24} strokeWidth={2.5} />
                </div>
                <p className="text-[8px] font-black text-emerald-600/70 uppercase tracking-[0.15em] mb-1.5">Usable Capacity</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{results.usableCapacity.toLocaleString()}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase">GB</p>
              </div>
            </motion.div>

            {/* Total Raw Capacity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
              className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br from-slate-500/10 to-transparent rounded-bl-[3rem] -z-0" />
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg mx-auto mb-3">
                  <Server size={24} strokeWidth={2.5} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">Raw Capacity</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{results.totalRawCapacity.toLocaleString()}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase">GB</p>
              </div>
            </motion.div>

            {/* Fault Tolerance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-[3rem] -z-0" />
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mx-auto mb-3">
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                <p className="text-[8px] font-black text-amber-600/70 uppercase tracking-[0.15em] mb-1.5">Fault Tolerance</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{results.faultTolerance}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase">Drive(s)</p>
              </div>
            </motion.div>

            {/* Storage Efficiency */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 }}
              className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-violet-50 to-white border-2 border-violet-200 overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-[3rem] -z-0" />
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mx-auto mb-3">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <p className="text-[8px] font-black text-violet-600/70 uppercase tracking-[0.15em] mb-1.5">Efficiency</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{results.storageEfficiency}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase">%</p>
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-200"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <Layers size={20} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Array Composition</p>
                  <p className="text-sm font-bold text-slate-700">{inputs.numberOfDrives}x {inputs.driveCapacityGB}GB drives in {results.raidInfo.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                <div className="text-right">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Lost to Overhead</p>
                  <p className="text-base md:text-lg font-black text-amber-600">{((100 - results.storageEfficiency).toFixed(1))}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

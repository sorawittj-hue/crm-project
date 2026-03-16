import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { Battery, Zap, Calculator } from 'lucide-react';

export default function UPSCalculator() {
  const [inputs, setInputs] = useState({ 
    totalLoadWatt: '', 
    requiredTimeMinutes: '', 
    powerFactor: '0.9',
    systemVoltage: '12'
  });
  
  const [results, setResults] = useState(null);

  const calculate = () => {
    const powerWatt = Number(inputs.totalLoadWatt) || 0;
    const timeMinutes = Number(inputs.requiredTimeMinutes) || 0;
    const pf = Number(inputs.powerFactor) || 0.9;
    const sysVolt = Number(inputs.systemVoltage) || 12;

    if (powerWatt <= 0 || timeMinutes <= 0) return;

    // 1. Calculate required VA (Volt-Ampere)
    const requiredVA = Math.ceil((powerWatt / pf) * 1.25); // 25% safety margin

    // 2. Calculate Battery Ah required
    // Formula: (Load in Watts * Backup Time in hours) / (System Voltage * Inverter Efficiency)
    // Assume Inverter Efficiency = 0.9 (90%)
    const backupHours = timeMinutes / 60;
    const requiredAh = Math.ceil((powerWatt * backupHours) / (sysVolt * 0.9));

    // 3. Estimate typical battery configuration
    const numBatteries = Math.ceil(sysVolt / 12); // Assuming 12V batteries
    const ahPerBattery = Math.ceil(requiredAh / numBatteries);

    setResults({
      requiredVA,
      requiredAh,
      numBatteries,
      ahPerBattery,
      sysVolt
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Load (Watts)</label>
          <Input 
            type="number" 
            placeholder="e.g., 500" 
            value={inputs.totalLoadWatt} 
            onChange={(e) => setInputs({ ...inputs, totalLoadWatt: e.target.value })} 
            className="rounded-xl border-slate-200 h-12" 
          />
          <p className="text-[9px] text-slate-400">Total power consumption of connected devices</p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Backup Time (Minutes)</label>
          <Input 
            type="number" 
            placeholder="e.g., 30" 
            value={inputs.requiredTimeMinutes} 
            onChange={(e) => setInputs({ ...inputs, requiredTimeMinutes: e.target.value })} 
            className="rounded-xl border-slate-200 h-12" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Power Factor</label>
          <select 
            value={inputs.powerFactor} 
            onChange={(e) => setInputs({ ...inputs, powerFactor: e.target.value })} 
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none border-0 ring-1 ring-slate-200"
          >
            <option value="0.6">Computer / Standard IT (0.6)</option>
            <option value="0.8">Server / Motor (0.8)</option>
            <option value="0.9">Modern / Pure Sine Wave (0.9)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPS System Voltage (DC)</label>
          <select 
            value={inputs.systemVoltage} 
            onChange={(e) => setInputs({ ...inputs, systemVoltage: e.target.value })} 
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none border-0 ring-1 ring-slate-200"
          >
            <option value="12">12V (Small UPS ≤ 1kVA)</option>
            <option value="24">24V (Medium UPS 1-3kVA)</option>
            <option value="48">48V (Large UPS {'>'} 3kVA)</option>
            <option value="96">96V (Enterprise UPS)</option>
          </select>
        </div>
      </div>

      <Button onClick={calculate} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.01] transition-all">
        <Calculator size={16} className="mr-2" /> Execute Power Calculation
      </Button>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Recommended UPS Size</p>
              <p className="text-3xl font-black text-slate-900 leading-none mt-2 tabular-nums">
                {results.requiredVA} <span className="text-lg text-slate-400">VA</span>
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-2">*Includes 25% safety margin</p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100/50 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <Battery size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest leading-none mb-1">Battery Requirement</p>
              <p className="text-3xl font-black text-slate-900 leading-none mt-2 tabular-nums">
                {results.requiredAh} <span className="text-lg text-amber-600/60">Ah Total</span>
              </p>
              <p className="text-[10px] font-bold text-slate-500 mt-2">
                Suggested Setup: {results.numBatteries}x 12V / {results.ahPerBattery}Ah batteries
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

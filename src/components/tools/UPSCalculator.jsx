import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { Battery, Zap, Calculator, TrendingUp, Plug, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

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

  const inputClasses = cn(
    "flex h-14 w-full rounded-2xl border-2 bg-white px-5 py-3 text-base font-bold outline-none transition-all duration-200",
    "border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
  );

  const labelClasses = "text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2";

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <Zap size={12} strokeWidth={3} />
            Total Load (Watts)
          </label>
          <Input
            type="number"
            placeholder="e.g., 500"
            value={inputs.totalLoadWatt}
            onChange={(e) => setInputs({ ...inputs, totalLoadWatt: e.target.value })}
            className={inputClasses}
          />
          <p className="text-[10px] font-bold text-slate-400 pl-1">Total power consumption of connected devices</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <Clock size={12} strokeWidth={3} />
            Backup Time (Minutes)
          </label>
          <Input
            type="number"
            placeholder="e.g., 30"
            value={inputs.requiredTimeMinutes}
            onChange={(e) => setInputs({ ...inputs, requiredTimeMinutes: e.target.value })}
            className={inputClasses}
          />
          <p className="text-[10px] font-bold text-slate-400 pl-1">Required backup duration</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <TrendingUp size={12} strokeWidth={3} />
            Power Factor
          </label>
          <select
            value={inputs.powerFactor}
            onChange={(e) => setInputs({ ...inputs, powerFactor: e.target.value })}
            className={inputClasses}
          >
            <option value="0.6">Computer / Standard IT (0.6)</option>
            <option value="0.8">Server / Motor (0.8)</option>
            <option value="0.9">Modern / Pure Sine Wave (0.9)</option>
          </select>
          <p className="text-[10px] font-bold text-slate-400 pl-1">Ratio of real power to apparent power</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-2"
        >
          <label className={labelClasses}>
            <Plug size={12} strokeWidth={3} />
            System Voltage (DC)
          </label>
          <select
            value={inputs.systemVoltage}
            onChange={(e) => setInputs({ ...inputs, systemVoltage: e.target.value })}
            className={inputClasses}
          >
            <option value="12">12V (Small UPS ≤ 1kVA)</option>
            <option value="24">24V (Medium UPS 1-3kVA)</option>
            <option value="48">48V (Large UPS {'>'} 3kVA)</option>
            <option value="96">96V (Enterprise UPS)</option>
          </select>
          <p className="text-[10px] font-bold text-slate-400 pl-1">DC battery bank voltage</p>
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
          <Calculator size={18} className="mr-3 shrink-0" />
          Execute Power Calculation
        </Button>
      </motion.div>

      {/* Results Section */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="grid md:grid-cols-2 gap-4 md:gap-6 mt-8"
        >
          {/* UPS Size Result */}
          <div className="group relative p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[4rem] -z-0" />
            <div className="relative z-10">
              <div className="flex items-start gap-4 md:gap-5 mb-5 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Zap size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Recommended UPS Size</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl md:text-5xl font-black text-slate-900 leading-none tabular-nums">
                      {results.requiredVA.toLocaleString()}
                    </p>
                    <span className="text-sm md:text-xl font-black text-slate-400">VA</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider">With Safety Margin</span>
                  <span className="text-xs md:text-sm font-black text-emerald-600">+25%</span>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider">Base Load</span>
                  <span className="text-xs md:text-sm font-black text-slate-700">{(results.requiredVA / 1.25).toFixed(0)} VA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Battery Requirement Result */}
          <div className="group relative p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-2 border-amber-200/50 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-[4rem] -z-0" />
            <div className="relative z-10">
              <div className="flex items-start gap-4 md:gap-5 mb-5 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                  <Battery size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] font-black text-amber-600/70 uppercase tracking-[0.2em] leading-none mb-2">Battery Configuration</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl md:text-5xl font-black text-slate-900 leading-none tabular-nums">
                      {results.requiredAh.toLocaleString()}
                    </p>
                    <span className="text-sm md:text-xl font-black text-amber-600/60">Ah</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-amber-100">
                  <span className="text-[8px] md:text-[9px] font-bold text-amber-700/70 uppercase tracking-wider">Battery Count</span>
                  <span className="text-base md:text-lg font-black text-slate-900">{results.numBatteries}x 12V</span>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-amber-100">
                  <span className="text-[8px] md:text-[9px] font-bold text-amber-700/70 uppercase tracking-wider">Per Battery</span>
                  <span className="text-base md:text-lg font-black text-slate-900">{results.ahPerBattery} Ah</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

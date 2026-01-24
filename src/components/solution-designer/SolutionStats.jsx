import React from 'react';
import { Zap, Weight, Thermometer, AlertCircle, CircleDollarSign } from 'lucide-react';

const SolutionStats = ({ rackItems }) => {
    const stats = rackItems.reduce((acc, item) => {
        acc.totalWatts += item.watts || 0;
        acc.totalBTU += item.btu || 0;
        acc.totalWeight += item.weight_kg || 0;
        acc.totalPrice += item.price || 0;

        if (item.isPowerSource) {
            acc.upsCapacity += item.capacity_watts || 0;
        }

        // Count types
        acc.counts[item.category] = (acc.counts[item.category] || 0) + 1;
        acc.totalU += item.u_height;
        return acc;
    }, {
        totalWatts: 0,
        totalBTU: 0,
        totalWeight: 0,
        totalPrice: 0,
        upsCapacity: 0,
        totalU: 0,
        counts: {}
    });

    const powerLoadPercent = stats.upsCapacity > 0 ? (stats.totalWatts / stats.upsCapacity) * 100 : 0;
    const isOverloaded = stats.totalWatts > stats.upsCapacity && stats.upsCapacity > 0;

    const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="flex flex-col gap-4">

            {/* Power Card */}
            <div className={`p-4 rounded-2xl border ${isOverloaded ? 'bg-red-50 border-red-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                        <Zap size={16} /> Power Load
                    </span>
                    {isOverloaded && <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded-full"><AlertCircle size={12} /> OVERLOAD</span>}
                </div>
                <div className="text-2xl font-black text-text-main mb-1">
                    {stats.totalWatts.toLocaleString()} <span className="text-sm font-medium text-gray-400">Watts</span>
                </div>

                {/* Progress Bar */}
                {stats.upsCapacity > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Current Load</span>
                            <span>{stats.upsCapacity.toLocaleString()}W Capacity</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${isOverloaded ? 'bg-red-500' : powerLoadPercent > 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(powerLoadPercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* BTU & Weight Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-2">
                        <Thermometer size={14} /> Cooling
                    </div>
                    <div className="text-lg font-bold text-text-main">
                        {(stats.totalBTU).toLocaleString()} <span className="text-xs font-medium text-gray-400">BTU/hr</span>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-2">
                        <Weight size={14} /> Weight
                    </div>
                    <div className="text-lg font-bold text-text-main">
                        {stats.totalWeight.toFixed(1)} <span className="text-xs font-medium text-gray-400">kg</span>
                    </div>
                </div>
            </div>

            {/* Price */}
            <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20">
                <div className="text-xs font-bold text-accent mb-1 flex items-center gap-1">
                    <CircleDollarSign size={14} /> Estimated Hardware Cost
                </div>
                <div className="text-2xl font-black text-accent">
                    {formatCurrency(stats.totalPrice)}
                </div>
                <p className="text-[10px] text-accent/60 mt-1">*Excluding licensing & implementation</p>
            </div>

            {/* Space Usage */}
            <div className="px-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                    <span>Rack Space Usage</span>
                    <span>{stats.totalU} / 42 U</span>
                </div>
                <div className="flex gap-0.5 h-3 rounded overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-sm ${i < stats.totalU ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default SolutionStats;

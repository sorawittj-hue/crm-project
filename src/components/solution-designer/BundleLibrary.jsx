import { useState } from 'react';
import { SOLUTION_BUNDLES } from './data/bundles';
import { Search, Package, ArrowRight, Download, CheckCircle2, ChevronDown, ChevronUp, Cpu, HardDrive, Monitor, ShieldCheck, Zap } from 'lucide-react';

const BundleLibrary = ({ onApplyRackTemplate, onExportBOM }) => {
    const [search, setSearch] = useState('');
    const [expandedSet, setExpandedSet] = useState(null);

    const filteredBundles = SOLUTION_BUNDLES.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);

    const handleAction = (bundle) => {
        if (bundle.isRackTemplate) {
            onApplyRackTemplate(bundle.rackItems);
        } else {
            onExportBOM(bundle);
        }
    };

    const toggleExpand = (id) => {
        setExpandedSet(expandedSet === id ? null : id);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search sets (Office, Pro, SME)..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-accent text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {filteredBundles.map(bundle => {
                    const isExpanded = expandedSet === bundle.id;

                    return (
                        <div
                            key={bundle.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                        >
                            <div className="p-4 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-black uppercase tracking-wider">{bundle.category}</span>
                                    {bundle.tag && <span className="text-[10px] font-bold text-warm-green-dark flex items-center gap-1"><CheckCircle2 size={10} /> {bundle.tag}</span>}
                                </div>

                                <h3 className="font-bold text-sm text-text-main mb-1">{bundle.name}</h3>
                                <p className="text-xs text-text-muted mb-3 line-clamp-2">{bundle.description}</p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleExpand(bundle.id)}
                                        className="flex-1 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent transition-colors flex items-center justify-center gap-1 border border-transparent hover:border-accent/20"
                                    >
                                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {isExpanded ? 'Hide Details' : 'View Full Specs'}
                                    </button>
                                </div>
                            </div>

                            {/* Detailed Specs Area */}
                            {isExpanded && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 space-y-3">
                                        {bundle.isRackTemplate ? (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-accent border-b border-accent/20 pb-1 flex items-center gap-1">
                                                    <Package size={12} /> Enterprise Components
                                                </p>
                                                {bundle.rackItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-[10px]">
                                                        <span className="text-text-main font-bold">• {item.id}</span>
                                                        <span className="text-text-muted">Pos: {item.uPosition}U</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            bundle.items.map((item, idx) => (
                                                <div key={idx} className="space-y-1.5 pt-2 first:pt-0 border-t border-gray-100 dark:border-gray-800 first:border-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-text-main">{item.name} <span className="text-accent">x{item.qty}</span></span>
                                                    </div>

                                                    {typeof item.specs === 'object' ? (
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                                                <Cpu size={10} className="text-accent" /> {item.specs.cpu}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                                                <Zap size={10} className="text-accent" /> {item.specs.ram}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                                                <HardDrive size={10} className="text-accent" /> {item.specs.storage}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                                                <Monitor size={10} className="text-accent" /> {item.specs.display}
                                                            </div>
                                                            <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-text-muted mt-1">
                                                                <ShieldCheck size={10} className="text-accent" /> {item.specs.os}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-text-muted italic">• {item.specs}</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bottom Footer */}
                            <div className="p-4 pt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 mt-auto">
                                <span className="font-black text-sm text-text-main">{formatCurrency(bundle.totalPrice)}</span>
                                <button
                                    onClick={() => handleAction(bundle)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-clay-sm
                                        ${bundle.isRackTemplate ? 'bg-accent text-white hover:bg-accent/80' : 'bg-warm-blue text-white hover:bg-warm-blue/80'}
                                    `}
                                >
                                    {bundle.isRackTemplate ? <><Package size={12} /> Apply Set</> : <><Download size={12} /> Get BOM</>}
                                    <ArrowRight size={10} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BundleLibrary;

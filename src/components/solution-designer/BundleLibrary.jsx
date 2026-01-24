import { useState } from 'react';
import { SOLUTION_BUNDLES } from './data/bundles';
import { Search, Package, ArrowRight, Download, CheckCircle2 } from 'lucide-react';

const BundleLibrary = ({ onApplyRackTemplate, onExportBOM }) => {
    const [search, setSearch] = useState('');

    const filteredBundles = SOLUTION_BUNDLES.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);

    const handleAction = (bundle) => {
        if (bundle.isRackTemplate) {
            onApplyRackTemplate(bundle.rackItems);
        } else {
            // For general bundles, we just export the BOM for now
            onExportBOM(bundle);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search sets (e.g. Office, Graphic)..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-accent text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {filteredBundles.map(bundle => (
                    <div
                        key={bundle.id}
                        className="group bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-black uppercase tracking-wider">{bundle.category}</span>
                            {bundle.tag && <span className="text-[10px] font-bold text-warm-green-dark flex items-center gap-1"><CheckCircle2 size={10} /> {bundle.tag}</span>}
                        </div>

                        <h4 className="font-bold text-sm text-text-main mb-1">{bundle.name}</h4>
                        <p className="text-xs text-text-muted mb-3 line-clamp-2">{bundle.description}</p>

                        <div className="space-y-1 mb-4">
                            {bundle.isRackTemplate ? (
                                <p className="text-[10px] text-accent font-bold flex items-center gap-1">
                                    <Package size={12} /> Includes {bundle.rackItems.length} Enterprise Components
                                </p>
                            ) : (
                                bundle.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[10px] text-gray-400">
                                        <span>• {item.name}</span>
                                        <span>x{item.qty}</span>
                                    </div>
                                ))
                            )}
                            {!bundle.isRackTemplate && bundle.items.length > 2 && <p className="text-[10px] text-gray-400 italic">+{bundle.items.length - 2} more items</p>}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
                            <span className="font-black text-sm text-text-main">{formatCurrency(bundle.totalPrice)}</span>
                            <button
                                onClick={() => handleAction(bundle)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1
                                    ${bundle.isRackTemplate ? 'bg-accent text-white hover:bg-accent/80' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}
                                `}
                            >
                                {bundle.isRackTemplate ? <><Package size={12} /> Apply Set</> : <><Download size={12} /> Get BOM</>}
                                <ArrowRight size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BundleLibrary;

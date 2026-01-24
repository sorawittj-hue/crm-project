import React, { useState, useMemo } from 'react';
import { Server, Save, RotateCcw, Download, Cpu, Activity, Zap, Scale, Box, AlertTriangle } from 'lucide-react';
import { IT_PRODUCTS } from './data/products';
import RackVisualizer from './RackVisualizer';
import ProductLibrary from './ProductLibrary';
import SolutionStats from './SolutionStats';

const SolutionLayout = ({ deals, onUpdateDeal }) => {
    // Rack State: Array of 42 slots (1 to 42). 
    // Each slot can hold a reference to an item.
    // Items larger than 1U will occupy multiple slots.
    const [rackItems, setRackItems] = useState([]); // { id: uniqueId, productId: '...', uPosition: 1, ...productData }
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const handleDropItem = (productId, targetU) => {
        const product = IT_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        // Validation: Check boundary
        if (targetU + product.u_height - 1 > 42) {
            alert("Not enough space at top of rack!");
            return;
        }

        // Validation: Check overlap
        const occupied = rackItems.some(item => {
            const itemStart = item.uPosition;
            const itemEnd = item.uPosition + item.u_height - 1;
            const newStart = targetU;
            const newEnd = targetU + product.u_height - 1;
            return (newStart <= itemEnd && newEnd >= itemStart);
        });

        if (occupied) {
            // alert("Slot is already occupied!"); // Optional: Silent fail or toast
            return;
        }

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),
            uPosition: targetU
        };

        setRackItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (uniqueId) => {
        setRackItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
        setSelectedItem(null);
    };

    const clearRack = () => {
        if (window.confirm("Clear entire rack design?")) {
            setRackItems([]);
        }
    };

    const handleExportBOM = () => {
        if (rackItems.length === 0) return alert("Rack is empty!");

        const headers = ["ID", "Product Name", "Category", "U Position", "Height (U)", "Power (W)", "Weight (kg)", "Price (THB)"];
        const rows = rackItems.sort((a, b) => b.uPosition - a.uPosition).map(item => [
            item.id,
            `"${item.name}"`,
            item.category,
            item.uPosition,
            item.u_height,
            item.watts,
            item.weight_kg,
            item.price
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `rack_design_bom_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveToDeal = async (dealId) => {
        const deal = deals.find(d => d.id === dealId);
        if (!deal) return;

        // Calculate Totals
        const totals = rackItems.reduce((acc, item) => ({
            watts: acc.watts + item.watts,
            weight: acc.weight + item.weight_kg,
            price: acc.price + item.price
        }), { watts: 0, weight: 0, price: 0 });

        // Create Summary String
        const summary = `
[Rack Design Summary]
Total Items: ${rackItems.length}
Total Power: ${totals.watts} W
Total Weight: ${totals.weight.toFixed(1)} kg
Est. Cost: ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totals.price)}

Items:
${rackItems.sort((a, b) => b.uPosition - a.uPosition).map(i => `- [U${i.uPosition}] ${i.name} (${i.id})`).join('\n')}
        `.trim();

        // Create Note Object
        const newNote = {
            id: Date.now(),
            text: summary,
            date: new Date().toISOString(),
            user: 'Solution Architect'
        };

        // Update Deal
        const updatedNotes = [...(deal.notes || []), newNote];

        // If the update function supports passing just the changes
        if (onUpdateDeal) {
            await onUpdateDeal(dealId, { notes: updatedNotes });
            alert("Rack Design saved to Deal notes successfully!");
            setIsSaveModalOpen(false);
        } else {
            alert("Error: Cannot save to deal (Update function missing)");
        }
    };

    const getAIInsight = () => {
        if (rackItems.length === 0) return "Start adding components to generate an architectural analysis.";

        const totalWatts = rackItems.reduce((sum, i) => sum + (i.watts || 0), 0);
        const hasUPS = rackItems.some(i => i.category === 'UPS');
        const upsCapacity = rackItems.reduce((sum, i) => sum + (i.capacity_watts || 0), 0);

        if (totalWatts > 0 && !hasUPS) return "⚠️ Critical: No UPS detected. Active equipment requires power backup protection.";
        if (hasUPS && totalWatts > upsCapacity) return "⚠️ Critical: Power Overload! UPS capacity is insufficient for current load.";
        if (hasUPS && totalWatts > (upsCapacity * 0.8)) return "⚠️ Warning: UPS load exceeds 80% safety margin. Consider adding another Power Module.";
        if (rackItems.length > 30) return "ℹ️ Optimization: High density rack. Verify rear airflow clearance > 30cm.";

        return "✅ System Optimal: Power redundancy and distribution efficiency are within Enterprise Grade standards.";
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 p-2 overflow-hidden text-text-main relative">
            {/* Save Modal */}
            {isSaveModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface p-6 rounded-2xl shadow-clay-lg w-full max-w-md border border-white/20">
                        <h3 className="text-xl font-bold mb-4">Save to Deal</h3>
                        <p className="text-sm text-text-muted mb-4">Select a deal to attach this rack design summary to.</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                            {deals && deals.length > 0 ? deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').map(deal => (
                                <button
                                    key={deal.id}
                                    onClick={() => handleSaveToDeal(deal.id)}
                                    className="w-full text-left p-3 rounded-xl bg-bg/50 hover:bg-accent/20 border border-transparent hover:border-accent transition-all group"
                                >
                                    <div className="font-bold text-sm text-text-main group-hover:text-accent">{deal.title}</div>
                                    <div className="text-xs text-text-muted">{deal.company} • {deal.stage}</div>
                                </button>
                            )) : <p className="text-center text-text-muted italic">No active deals found.</p>}
                        </div>
                        <button onClick={() => setIsSaveModalOpen(false)} className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold">Cancel</button>
                    </div>
                </div>
            )}

            {/* LEFT: Product Library */}
            <div className="w-1/4 min-w-[300px] flex flex-col gap-4">
                <div className="bg-surface rounded-3xl p-6 shadow-clay-md border border-white/60 h-full overflow-hidden flex flex-col">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Server className="text-accent" /> Component Library
                    </h2>
                    <ProductLibrary />
                </div>
            </div>

            {/* CENTER: Rack Visualization */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-surface rounded-3xl p-6 shadow-clay-md border border-white/60 h-full overflow-hidden flex flex-col relative">
                    <div className="absolute top-6 right-6 flex gap-2 z-10">
                        <button onClick={handleExportBOM} className="p-2 rounded-xl hover:bg-blue-100 text-blue-500 transition-colors" title="Export BOM (CSV)"><Download size={20} /></button>
                        <button onClick={() => setIsSaveModalOpen(true)} className="p-2 rounded-xl hover:bg-green-100 text-green-500 transition-colors" title="Save to Deal"><Save size={20} /></button>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <button onClick={clearRack} className="p-2 rounded-xl hover:bg-red-100 text-red-500 transition-colors" title="Clear Rack"><RotateCcw size={20} /></button>
                    </div>

                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Box className="text-accent" /> 42U Enterprise Rack
                    </h2>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <RackVisualizer
                            rackItems={rackItems}
                            onDropItem={handleDropItem}
                            onRemoveItem={handleRemoveItem}
                            onSelectItem={setSelectedItem}
                            selectedItem={selectedItem}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: Stats & Solutions */}
            <div className="w-1/4 min-w-[300px] flex flex-col gap-4">
                <div className="bg-surface rounded-3xl p-6 shadow-clay-md border border-white/60 h-full overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="text-accent" /> Solution Analysis
                    </h2>
                    <SolutionStats rackItems={rackItems} />

                    <div className="mt-4 p-4 bg-accent/10 rounded-2xl border border-accent/20">
                        <h4 className="font-bold text-accent mb-2 flex items-center"><Zap size={16} className="mr-1" /> AI Optimization</h4>
                        <p className="text-xs text-text-muted">
                            {getAIInsight()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolutionLayout;

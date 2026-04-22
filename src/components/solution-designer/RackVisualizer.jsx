import { X } from 'lucide-react';

const UNIT_HEIGHT_PX = 30; // 1U height in pixels

// Slot Component (Drop Target)
const RackSlot = ({ u, onDrop }) => {
    const handleDragOver = (e) => {
        e.preventDefault(); // Necesssary to allow dropping
        e.currentTarget.classList.add('bg-accent/20');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-accent/20');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-accent/20');
        const productId = e.dataTransfer.getData('productId');
        if (productId) {
            onDrop(productId, u);
        }
    };

    return (
        <div
            className="w-full border-b border-gray-200 dark:border-gray-700 flex items-center relative group transition-colors"
            style={{ height: `${UNIT_HEIGHT_PX}px` }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Rack Ear / Label */}
            <div className="w-8 h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-mono text-gray-400 select-none border-r border-gray-300 dark:border-gray-600">
                {u}
            </div>

            {/* Background Hole Pattern (Aesthetic) */}
            <div className="flex-1 h-full flex items-center px-2 gap-1 opacity-20 pointer-events-none">
                <div className="h-1.5 w-1.5 rounded-full bg-black/20"></div>
                <div className="flex-1"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-black/20"></div>
            </div>
        </div>
    );
};

// Placed Item Component
const PlacedItem = ({ item, onDelete, onSelect, isSelected }) => {
    return (
        <div
            className={`absolute left-8 right-0 mx-1 z-10 rounded-md border shadow-sm overflow-hidden flex items-center px-3 gap-3 
        ${isSelected ? 'ring-2 ring-accent border-accent z-20' : 'border-black/10 hover:border-accent/50'}
        cursor-pointer transition-all hover:shadow-md group animate-in fade-in zoom-in-95 duration-200`}
            style={{
                bottom: `${(item.uPosition - 1) * UNIT_HEIGHT_PX + 2}px`, // +2 for margin
                height: `${item.u_height * UNIT_HEIGHT_PX - 4}px`, // -4 for margin
                backgroundColor: item.color || '#ddd'
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 pointer-events-none"></div>

            {/* Item Content */}
            <div className="relative flex-1 flex items-center justify-between text-white drop-shadow-md">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-xs whitespace-nowrap">{item.name}</span>
                    <span className="text-[10px] opacity-80 hidden sm:inline-block truncate">({item.id})</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-black/30 px-1.5 rounded">{item.watts}W</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.uniqueId); }}
                        className="p-1 hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const RackVisualizer = ({ rackItems, onDropItem, onRemoveItem, onSelectItem, selectedItem }) => {
    // Generate 42 slots (42 down to 1)
    const slots = Array.from({ length: 42 }, (_, i) => 42 - i);

    return (
        <div className="relative w-full max-w-[600px] bg-white dark:bg-gray-950 shadow-2xl rounded-sm border-x-4 border-gray-300 dark:border-gray-800">
            {/* Top Cap */}
            <div className="h-4 bg-gray-300 dark:bg-gray-800 rounded-t-sm border-b border-gray-400"></div>

            {/* Rack Inner */}
            <div className="relative" style={{ height: `${42 * UNIT_HEIGHT_PX}px` }}>
                {/* Layer 0: Empty Slots (Drop Targets) */}
                {slots.map(u => (
                    <RackSlot key={u} u={u} onDrop={onDropItem} />
                ))}

                {/* Layer 1: Placed Items (Absolute) */}
                {rackItems.map(item => (
                    <PlacedItem
                        key={item.uniqueId}
                        item={item}
                        onDelete={onRemoveItem}
                        onSelect={onSelectItem}
                        isSelected={selectedItem?.uniqueId === item.uniqueId}
                    />
                ))}
            </div>

            {/* Bottom Cap */}
            <div className="h-8 bg-gray-800 rounded-b-sm shadow-xl flex items-center justify-center">
                <span className="text-white/30 text-[10px] tracking-[0.2em] font-bold">ENTERPRISE RACK SYSTEM</span>
            </div>
        </div>
    );
};

export default RackVisualizer;

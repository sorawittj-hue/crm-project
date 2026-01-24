import { useState } from 'react';
import { IT_PRODUCTS } from './data/products';
import { Search } from 'lucide-react';

const ProductLibrary = () => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const categories = ['All', 'Server', 'Network', 'Storage', 'UPS', 'Software'];

    const filteredProducts = IT_PRODUCTS.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleDragStart = (e, product) => {
        e.dataTransfer.setData('productId', product.id);
        e.dataTransfer.effectAllowed = 'copy';
        // Create a custom drag image if needed, or default
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-accent text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(c => (
                    <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === c
                            ? 'bg-accent text-white shadow-clay-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {filteredProducts.map(product => (
                    <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product)}
                        className="group cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex gap-3 items-center select-none"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-1 shrink-0 overflow-hidden border border-gray-100">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-text-main truncate">{product.name}</h4>
                            <p className="text-xs text-text-muted truncate">{product.description}</p>
                            <div className="flex gap-2 mt-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{product.u_height}U</span>
                                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold">{product.watts}W</span>
                            </div>
                        </div>
                        {/* Grab Handle Hint */}
                        <div className="opacity-0 group-hover:opacity-100 text-gray-300">
                            ⋮⋮
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductLibrary;

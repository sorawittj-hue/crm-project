export const SOLUTION_BUNDLES = [
    {
        id: 'office-standard',
        name: 'Standard Office Set (SME)',
        description: 'Complete setup for general office work.',
        category: 'Workspace',
        items: [
            { name: 'Business Notebook Core i5', specs: '16GB RAM, 512GB SSD, 14" IPS', price: 28500, qty: 1 },
            { name: '24" Full HD Monitor', specs: 'IPS, Height Adjustable', price: 5500, qty: 1 },
            { name: 'USB-C Docking Station', specs: 'Dual Display Support', price: 4500, qty: 1 },
            { name: 'Wireless Keyboard & Mouse', specs: 'Ergonomic Design', price: 1200, qty: 1 }
        ],
        totalPrice: 39700,
        tag: 'Popular'
    },
    {
        id: 'graphic-pro',
        name: 'Graphic Design Elite',
        description: 'High-performance workstation for creative pros.',
        category: 'Workspace',
        items: [
            { name: 'Workstation PC High-End', specs: 'Core i9, 64GB RAM, RTX 4070 Ti', price: 75000, qty: 1 },
            { name: '27" 4K Designer Monitor', specs: '100% sRGB, Color Calibrated', price: 18900, qty: 2 },
            { name: 'Professional Pen Tablet', specs: 'Medium size, 8k Pressure levels', price: 12500, qty: 1 }
        ],
        totalPrice: 125300,
        tag: 'High Performance'
    },
    {
        id: 'sme-server-set',
        name: 'SME Infrastructure Set',
        description: 'Essential server & network for small offices.',
        category: 'Infrastructure',
        isRackTemplate: true,
        rackItems: [
            { id: 'srv-dell-r750', uPosition: 1 },
            { id: 'net-cisco-c9300', uPosition: 3 },
            { id: 'ups-apc-3000', uPosition: 5 },
            { id: 'patch-panel', uPosition: 7 }
        ],
        totalPrice: 620000,
        tag: 'Infrastructure'
    }
];

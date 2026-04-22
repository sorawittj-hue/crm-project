export const SOLUTION_BUNDLES = [
    {
        id: 'office-standard',
        name: 'Standard Office Set (SME)',
        description: 'Perfect for general administration, HR, and accounting tasks.',
        category: 'Workspace',
        items: [
            {
                name: 'Business Notebook Core i5',
                specs: {
                    cpu: 'Intel Core i5-1335U (10 Cores, 4.6GHz)',
                    ram: '16GB DDR4 3200MHz',
                    storage: '512GB NVMe PCIe Gen4 SSD',
                    display: '14.0" FHD (1920x1080) Anti-glare',
                    os: 'Windows 11 Pro License'
                },
                price: 28500,
                qty: 1
            },
            { name: '24" Full HD Monitor', specs: 'IPS Panel, 75Hz, HDMI/DP', price: 5500, qty: 1 },
            { name: 'USB-C Universal Dock', specs: '65W Power Delivery, Dual 4K Support', price: 4500, qty: 1 },
            { name: 'Wireless Desktop Set', specs: 'Silent Keys, 2.4GHz Wireless', price: 1200, qty: 1 }
        ],
        totalPrice: 39700,
        tag: 'Popular'
    },
    {
        id: 'graphic-pro',
        name: 'Creative Pro Workstation',
        description: 'Optimized for Adobe Creative Cloud, 3D Rendering, and Video Editing.',
        category: 'Workspace',
        items: [
            {
                name: 'Precision Workstation Tower',
                specs: {
                    cpu: 'Intel Core i9-14900K (24 Cores, 6.0GHz)',
                    ram: '64GB (2x32GB) DDR5 5600MHz ECC',
                    storage: '2TB Gen4 NVMe + 4TB Enterprise HDD',
                    display: 'NVIDIA RTX 4000 Ada Generation (20GB)',
                    os: 'Windows 11 Pro for Workstations'
                },
                price: 95000,
                qty: 1
            },
            { name: '27" 4K Designer Monitor', specs: 'DisplayHDR 400, 100% sRGB, Hardware Calibration', price: 18900, qty: 2 },
            { name: 'Professional Pen Tablet', specs: '8192 levels, Bluetooth/Wired', price: 12500, qty: 1 }
        ],
        totalPrice: 145300,
        tag: 'High Performance'
    },
    {
        id: 'dev-power',
        name: 'Developer Power Kit',
        description: 'Built for high-end compilation, Docker virtualization, and multi-service development.',
        category: 'Workspace',
        items: [
            {
                name: 'Developer Laptop Pro',
                specs: {
                    cpu: 'Apple M3 Pro (12-core CPU, 18-core GPU)',
                    ram: '36GB Unified Memory',
                    storage: '1TB Super-fast SSD',
                    display: '14.2" Liquid Retina XDR (120Hz ProMotion)',
                    os: 'macOS Sonoma'
                },
                price: 79900,
                qty: 1
            },
            { name: 'Mechanical Keyboard', specs: 'Hot-swappable, Brown Switches, RGB', price: 4500, qty: 1 },
            { name: 'Ergonomic Vertical Mouse', specs: 'Precision Tracking, Multi-device', price: 3200, qty: 1 }
        ],
        totalPrice: 87600,
        tag: 'Top Choice'
    },
    {
        id: 'sme-server-set',
        name: 'Hybrid SME Infrastructure',
        description: 'All-in-one server solution for local file storage, AD, and Backup.',
        category: 'Infrastructure',
        isRackTemplate: true,
        rackItems: [
            { id: 'srv-dell-r750', uPosition: 1, customNote: 'Main Server (AD/Files)' },
            { id: 'store-dell-me5', uPosition: 3, customNote: 'iSCSI Storage SAN' },
            { id: 'net-cisco-c9300', uPosition: 5, customNote: 'Core Switch 10G' },
            { id: 'ups-apc-3000', uPosition: 7, customNote: 'Main UPS 3kVA' }
        ],
        totalPrice: 1120000,
        tag: 'Infrastructure'
    }
];

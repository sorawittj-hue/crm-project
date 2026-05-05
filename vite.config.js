import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorChunks = [
  ['vendor-react', ['react', 'react-dom', 'react-router-dom']],
  ['vendor-query', ['@tanstack/react-query', 'zustand']],
  ['vendor-supabase', ['@supabase/supabase-js']],
  [
    'vendor-ui',
    [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-switch',
      'cmdk',
    ],
  ],
  ['vendor-charts', ['recharts']],
  ['vendor-motion', ['framer-motion']],
  ['vendor-utils', ['lucide-react', 'clsx', 'tailwind-merge']],
];

const getManualChunk = (id) => {
  if (!id.includes('node_modules')) return undefined;

  const normalizedId = id.replaceAll('\\', '/');
  for (const [chunkName, packages] of vendorChunks) {
    if (packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }

  return undefined;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7777,
    strictPort: false, // ถ้า port ซ้ำจะหา port ถัดไปอัตโนมัติ
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
})

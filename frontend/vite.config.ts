import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('leaflet')) return 'vendor-leaflet';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        }
      }
    }
  }
});

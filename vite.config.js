import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/storage-proxy': {
        target: 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-proxy/, '')
      }
    }
  },
  test: {
    // Unit tests only; supabase/tests/rls.test.mjs is a standalone script (npm run test:rls)
    include: ['src/**/*.test.{js,ts,jsx,tsx}']
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 🔥 FIX: Set to true to allow any host (like ngrok)
    // Using true instead of 'all' matches the TypeScript definition
    allowedHosts: true, 
    
    // This allows the server to be accessible over your local network
    host: true, 
  },
});
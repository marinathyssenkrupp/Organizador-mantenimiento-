import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel injects process.env variables, but purely client-side apps might need this polyfill
    'process.env': process.env
  }
});
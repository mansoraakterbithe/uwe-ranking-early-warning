import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: path.resolve(__dirname, '..', 'dist'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

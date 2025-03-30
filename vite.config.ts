import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api/claude': {
          // Aquí cambiamos para apuntar a nuestro servidor Express en lugar de directamente a Anthropic
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
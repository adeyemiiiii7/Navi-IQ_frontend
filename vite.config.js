import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-200-html',
      closeBundle() {
        // Copy index.html to 200.html in the dist folder after build
        const indexPath = resolve(__dirname, 'dist', 'index.html')
        const targetPath = resolve(__dirname, 'dist', '200.html')
        
        if (fs.existsSync(indexPath)) {
          try {
            fs.copyFileSync(indexPath, targetPath)
            console.log('Successfully copied index.html to 200.html for SPA routing')
          } catch (err) {
            console.error('Error copying 200.html:', err)
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    // Increase the chunk size warning limit to avoid warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Configure manual chunks to better split the code
        manualChunks: (id) => {
          // Put react and react-dom in a separate vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Put other major dependencies in their own chunks
          if (id.includes('node_modules/')) {
            // Extract the package name from the path
            const packageName = id.toString().split('node_modules/')[1].split('/')[0];
            // Group smaller packages together
            return `vendor-${packageName}`;
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    historyApiFallback: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})

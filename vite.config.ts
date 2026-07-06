import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Disable source maps in production to reduce bundle size and avoid leaking source
    sourcemap: false,
    // Use esbuild for fast, efficient minification
    minify: 'esbuild',
    // Warn when chunks exceed 500KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better caching
        manualChunks: (id) => {
          // React core — changes rarely, cache aggressively
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          // TanStack libraries
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router')) {
            return 'vendor-router'
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query'
          }
          // Animation library (framer-motion / motion) — large, isolate it
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          // Zustand state management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state'
          }
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('@hookform')) {
            return 'vendor-forms'
          }
          // Zod validation
          if (id.includes('node_modules/zod')) {
            return 'vendor-validation'
          }
          // All other node_modules go into a shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
      },
    },
  },
})

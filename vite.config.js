import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The source uses JSX inside .js files (a Create React App habit),
// so tell Vite and esbuild to parse them as JSX.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ }), tailwindcss()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/images': 'http://127.0.0.1:8000',
    },
  },
  // Django serves the build: index.html from build/, assets from build/static/.
  build: {
    outDir: 'build',
    assetsDir: 'static/assets',
    chunkSizeWarningLimit: 3000,
  },
})

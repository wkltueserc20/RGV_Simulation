import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages needs /RGV_Simulation/ as base; Vercel and local use /
const base = process.env.GITHUB_PAGES === 'true' ? '/RGV_Simulation/' : '/'

// When running under Tauri (tauri dev), use a fixed port and don't open the browser
const isTauri = process.env.TAURI_ENV_DEBUG !== undefined

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
  },
  server: isTauri ? {
    port: 1420,
    strictPort: true,
    open: false,
  } : {},
})

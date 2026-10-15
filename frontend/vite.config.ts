import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The browser talks to /api on its own origin, so the session cookie stays first-party.
// In development Vite forwards those requests to the FastAPI server (GERENCIA_API_URL overrides it).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: { proxy: { '/api': env.GERENCIA_API_URL || 'http://127.0.0.1:8000' } },
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// O navegador chama /api no próprio endereço do site, então o cookie de sessão
// fica no mesmo domínio. Em desenvolvimento, o Vite repassa essas chamadas para
// a API FastAPI; GERENCIA_API_URL troca o endereço dela.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: { proxy: { '/api': env.GERENCIA_API_URL || 'http://127.0.0.1:8000' } },
  }
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El puerto 5173 es parte de la Redirect URI registrada en el SSO (http://localhost:5173/):
// si estuviera ocupado, Vite NO debe cambiarlo en silencio.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 5174 es parte de la Redirect URI registrada en el SSO (http://localhost:5174/).
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})

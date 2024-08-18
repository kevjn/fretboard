import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/fretboard/", // https://vitejs.dev/guide/static-deploy.html#github-pages
})

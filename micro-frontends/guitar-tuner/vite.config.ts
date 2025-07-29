import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: "./", // this is required for url important statements that need to be relative to the import context
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },

    // useful for debugging the bundled js
    minify: false,
    sourcemap: true,
  },
})

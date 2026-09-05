import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
// Single-file build used only for hosted previews (no PWA, guest mode).
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { outDir: 'dist-preview', emptyOutDir: true } })

import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        mapa: path.resolve(__dirname, 'pages/mapa.html'),
        catalogo: path.resolve(__dirname, 'pages/catalogo.html'),
        herramientas: path.resolve(__dirname, 'pages/herramientas.html'),
        acerca_de: path.resolve(__dirname, 'pages/acerca_de.html'),
        visor3d: path.resolve(__dirname, 'pages/visor3d.html'),
        informacion: path.resolve(__dirname, 'pages/informacion.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'main') {
            return 'assets/[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (/\.css$/.test(info)) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
    // Los CDNs ya están en index.html directamente, no necesitamos el plugin
  ],
  base: '/orbix/',  // 👈 esto es clave
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist/orbix',
    assetsDir: 'assets'
  }
});

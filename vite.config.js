import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync } from 'fs';

export default defineConfig({
  root: '.',
  plugins: [
    {
      name: 'copy-rydalca',
      closeBundle() {
        cpSync(resolve(__dirname, 'rydalca'), resolve(__dirname, 'dist/rydalca'), { recursive: true });
      },
    },
    {
      // assets/ (favicons, logos, imágenes) se referencia desde JS con rutas de
      // texto plano ("assets/logos/x.png"), no con import — Vite no las detecta
      // por análisis estático y nunca las copiaba a dist/, de ahí los 404 en producción.
      name: 'copy-assets',
      closeBundle() {
        cpSync(resolve(__dirname, 'assets'), resolve(__dirname, 'dist/assets'), { recursive: true });
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:         resolve(__dirname, 'index.html'),
        login:         resolve(__dirname, 'login.html'),
        register:      resolve(__dirname, 'register.html'),
        planes:        resolve(__dirname, 'planes.html'),
        verificarPago: resolve(__dirname, 'verificar-pago.html'),
        pagoExitoso:   resolve(__dirname, 'pago-exitoso.html'),
        confirm:       resolve(__dirname, 'confirm.html'),
        confirmError:  resolve(__dirname, 'confirm-error.html'),
        contacto:      resolve(__dirname, 'contacto.html'),
        about:         resolve(__dirname, 'about.html'),
        autonomos:     resolve(__dirname, 'autonomos.html'),
        agenciaIa:     resolve(__dirname, 'agencia-ia.html'),
      },
    },
  },
});

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
    // Por defecto Vite incrusta como data: URI cualquier imagen referenciada en
    // el HTML que pese menos de 4KB (favicon.png son 2959 bytes) — sustituye el
    // <img src="assets/favicon.png"> por un base64 en el propio HTML. Nuestro
    // CSP es estricto (img-src 'self', sin data:) así que el navegador lo
    // bloquea: el archivo cargaba bien solo, pero la referencia real de la
    // página apuntaba a otra cosa. 0 = nunca incrustar, siempre URL de archivo real.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index:         resolve(__dirname, 'index.html'),
        login:         resolve(__dirname, 'login.html'),
        register:      resolve(__dirname, 'register.html'),
        planes:        resolve(__dirname, 'planes.html'),
        verificarPago: resolve(__dirname, 'verificar-pago.html'),
        pagoExitoso:   resolve(__dirname, 'pago-exitoso.html'),
        completarRegistro: resolve(__dirname, 'completar-registro.html'),
        restablecerPassword: resolve(__dirname, 'restablecer-password.html'),
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

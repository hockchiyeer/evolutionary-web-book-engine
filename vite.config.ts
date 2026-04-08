import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';
import { googleSearchFallbackPlugin } from './server/googleSearchFallback.ts';
import { generatePdf } from './server/pdfBridge.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      googleSearchFallbackPlugin(),
      {
        name: 'pdf-bridge',
        configureServer(server) {
          server.middlewares.use('/__pdf', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end();
            }
            try {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                const { html, fileName } = JSON.parse(body);
                const pdfBuffer = await generatePdf(html);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader(
                  'Content-Disposition',
                  `attachment; filename="${fileName || 'webbook'}.pdf"`
                );
                res.end(pdfBuffer);
              });
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end('PDF generation failed');
            }
          });
        },
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server:
    {
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});



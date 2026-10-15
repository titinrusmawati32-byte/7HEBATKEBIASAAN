import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for JSON and text payloads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Proxy for Google Apps Script Web App
  // Solves browser CORS and cross-domain 302 redirect issues seamlessly
  app.post('/api/gas-proxy', async (req, res) => {
    try {
      const { gasUrl, action, payload } = req.body;
      if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.trim()) {
        return res.status(400).json({ success: false, message: 'URL Google Apps Script tidak valid.' });
      }

      const cleanUrl = gasUrl.trim();

      // Forward request to Google Apps Script
      const gasResponse = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, payload: payload || {} }),
        redirect: 'follow'
      });

      const responseText = await gasResponse.text();

      // Check if Google returned an HTML login redirect (e.g. deployment was set to 'Only myself')
      if (
        responseText.includes('<!DOCTYPE html>') ||
        responseText.includes('accounts.google.com') ||
        responseText.includes('ServiceLogin')
      ) {
        return res.json({
          success: false,
          isAuthError: true,
          message: 'Google Apps Script meminta login Google. Pastikan saat Deploy di Apps Script memilih "Who has access: Anyone" (Bukan "Only myself").'
        });
      }

      try {
        const json = JSON.parse(responseText);
        return res.json(json);
      } catch {
        return res.json({
          success: false,
          message: 'Google Apps Script merespons teks non-JSON: ' + responseText.substring(0, 150)
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghubungi Google Apps Script: ' + error.message
      });
    }
  });

  // GET probe for Google Apps Script Web App testing
  app.get('/api/gas-proxy', async (req, res) => {
    try {
      const gasUrl = req.query.gasUrl as string;
      if (!gasUrl || !gasUrl.trim()) {
        return res.status(400).json({ success: false, message: 'Parameter gasUrl tidak ditemukan.' });
      }

      const cleanUrl = gasUrl.trim();
      const gasResponse = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      const responseText = await gasResponse.text();

      if (
        responseText.includes('<!DOCTYPE html>') ||
        responseText.includes('accounts.google.com') ||
        responseText.includes('ServiceLogin')
      ) {
        return res.json({
          success: false,
          isAuthError: true,
          message: 'Google Apps Script meminta autentikasi. Pastikan saat Deploy Web App memilih "Who has access: Anyone".'
        });
      }

      try {
        const json = JSON.parse(responseText);
        return res.json(json);
      } catch {
        return res.json({
          success: true,
          message: 'Web App merespons dengan baik.'
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghubungi Web App: ' + error.message
      });
    }
  });

  // Dev mode: Mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();

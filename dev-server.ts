import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/src/app';
import { env } from './backend/src/config/env';
import { logger } from './backend/src/utils/logger';
import { checkDatabaseConnection } from './backend/src/config/database';
import { startNotificationDispatcher } from './backend/src/modules/notifications/services/notification-dispatch.service';

async function startDevServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  const vite = await createViteServer({
    server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
    appType: 'spa',
  });

  app.use((req, res, next) => {
    const url = req.url || '';
    if (url === '/@vite/client' || url.startsWith('/@vite/client?')) {
      const originalEnd = res.end.bind(res);
      const chunks: Buffer[] = [];
      res.write = function (chunk: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      } as any;
      res.end = function (chunk: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        let body = Buffer.concat(chunks).toString('utf-8');
        body = body.replace(/transport\.connect\(createHMRHandler\(handleMessage\)\);/g, '/* HMR connection disabled in dev container */');
        body = body.replace(/console\.error\(\s*([`'"])\[vite\]/g, 'console.debug($1[vite]');
        res.setHeader('content-length', Buffer.byteLength(body));
        return (originalEnd as any).call(res, body, ...args);
      } as any;
    }
    next();
  });

  app.use(vite.middlewares);

  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy) logger.warn('Starting development server without a verified database connection.');

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`TECUMP Development Server running on http://0.0.0.0:${PORT}`);
    logger.info(`Health check: http://0.0.0.0:${PORT}/health`);
  });

  try {
    const stopDispatcher = startNotificationDispatcher(env.NOTIFICATION_DISPATCH_INTERVAL_MS || 30000);
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      stopDispatcher();
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.warn({ err }, 'Notification dispatcher warning');
  }
}

startDevServer().catch((err) => {
  console.error('Fatal development startup error:', err);
  process.exit(1);
});

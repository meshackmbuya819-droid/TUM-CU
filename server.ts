import express from 'express';
import path from 'path';
import { createApp } from './backend/src/app';
import { env } from './backend/src/config/env';
import { logger } from './backend/src/utils/logger';
import { checkDatabaseConnection } from './backend/src/config/database';
import { startNotificationDispatcher } from './backend/src/modules/notifications/services/notification-dispatch.service';

async function startServer() {
  // Production server only: Vite is used during development/build, never at runtime.
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;
  const distPath = path.resolve(process.cwd(), 'dist');

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy && env.NODE_ENV === 'production') {
    logger.error('Refusing to start production without a verified database connection.');
    process.exit(1);
  }
  if (!dbHealthy) {
    logger.warn('Starting without a verified database connection in non-production mode.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`TECUMP Server running on http://0.0.0.0:${PORT} (production)`);
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

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

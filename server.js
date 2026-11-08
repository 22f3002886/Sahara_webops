import { createApp } from './lib/app.js';
const { app, db } = createApp();
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, process.env.HOST || '127.0.0.1', () =>
  console.log(`SAHARA: http://localhost:${port}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

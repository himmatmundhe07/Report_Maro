// src/index.js
require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { getRedisClient, closeRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully!');

    // 2. Initialize Redis (no need to wait for "ready")
    const redis = getRedisClient();
    console.log('✅ Redis initialized');

    // 2.1 Start BullMQ AI Worker
    try {
      require('./queue/worker');
    } catch (workerErr) {
      console.warn('⚠️ [Worker] Worker auto-init warning:', workerErr.message);
    }

    // 3. Start the server IMMEDIATELY
    // Wrapped in http.createServer so Socket.io can share the same port —
    // app.listen() alone can't attach a socket server to it afterwards.
    const server = http.createServer(app);
    initSocket(server, app);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`Received ${signal}, closing gracefully...`);
      await closeRedis();
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
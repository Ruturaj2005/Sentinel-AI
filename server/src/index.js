import app from './app.js';
import connectDatabase from './config/database.js';
import env from './config/env.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    app.listen(env.port, () => {
      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║          Sentinel API Server Started              ║');
      console.log('╚════════════════════════════════════════════════════╝\n');
      console.log(`🌐 Server:      http://localhost:${env.port}`);
      console.log(`📝 API:         http://localhost:${env.port}/api`);
      console.log(`🏥 Health:      http://localhost:${env.port}/api/health`);
      console.log(`🔧 Environment: ${env.nodeEnv}`);
      console.log('\n📡 Waiting for requests...\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

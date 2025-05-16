import app from './app';

// Use Railway PORT environment variable if available
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`ERROR: ${err.message}`);
  console.log('Shutting down server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log(`ERROR: ${err.message}`);
  console.log('Shutting down server due to uncaught exception');
  process.exit(1);
});

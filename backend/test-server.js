import express from 'express';

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Test server is working!');
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
  console.log('If you can see this, the server started successfully.');
  console.log('Press Ctrl+C to stop.');
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  process.exit(0);
});

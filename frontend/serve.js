const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes by serving index.html (for client-side routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Frontend server running at:`);
  console.log(`   - Local:   http://${HOST}:${PORT}`);
});

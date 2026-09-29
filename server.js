const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error('BACKEND_URL must point to the backend Render service.');
}

const app = express();
const buildDirectory = path.join(__dirname, 'build');
const shouldProxy = (pathname) =>
  pathname === '/api' || pathname.startsWith('/api/') ||
  pathname === '/ws-trading' || pathname.startsWith('/ws-trading/');

const backendProxy = createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  ws: true,
  pathFilter: shouldProxy,
});

app.use(backendProxy);
app.use(express.static(buildDirectory));
app.use((request, response) => {
  response.sendFile(path.join(buildDirectory, 'index.html'));
});

const server = app.listen(process.env.PORT || 10000);
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/ws-trading' || pathname.startsWith('/ws-trading/')) {
    backendProxy.upgrade(request, socket, head);
  } else {
    socket.destroy();
  }
});
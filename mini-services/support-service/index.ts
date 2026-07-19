import { createServer } from 'http';

const PORT = 3003;
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'doudou66_,ducks_are_cool_1').split(',');

const httpServer = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
    return;
  }

  // Personnel endpoint (returns empty when no Discord bot)
  if (req.url === '/api/personnel' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Forward message to Discord DMs
  if (req.url === '/api/forward-message' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      try {
        const { ticketId, username, sender, text } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] [${ticketId}] ${sender} (${username}): ${text}`);
        // TODO: Integrate Discord.js to send DMs to admins
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  // Notify admins about new ticket
  if (req.url === '/api/notify-admins' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      try {
        const { ticketId, username, subject } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] New ticket ${ticketId} from ${username} [${subject}]`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  // Send verification code
  if (req.url === '/api/send-code' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, code } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] Verification code for ${username}: ${code}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

httpServer.listen(PORT, () => {
  console.log(`[SUPPORT-SVC] Support service running on port ${PORT}`);
});

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)); });
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)); });
import { execSync } from 'child_process';

try {
  const base = 'http://localhost:5000/api';

  console.log('Logging in via curl...');
  const loginCmd = `curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"employee@wyze.com\",\"password\":\"password123\"}" ${base}/auth/login`;
  const loginOut = execSync(loginCmd, { encoding: 'utf8' });
  const loginJson = JSON.parse(loginOut);
  if (!loginJson.token) {
    console.error('Login failed', loginJson);
    process.exit(1);
  }
  const token = loginJson.token;

  console.log('Fetching ticket via curl...');
  const ticketCmd = `curl -s -H "Authorization: Bearer ${token}" ${base}/tickets/1`;
  const ticketOut = execSync(ticketCmd, { encoding: 'utf8' });
  const ticketJson = JSON.parse(ticketOut);
  console.log('Ticket:', JSON.stringify(ticketJson, null, 2));

  if (ticketJson && Array.isArray(ticketJson.comments) && ticketJson.creator) {
    console.log('Smoke (curl) verification OK');
    process.exit(0);
  }

  console.error('Smoke (curl) verification failed: missing comments or creator');
  process.exit(2);
} catch (err) {
  console.error('Smoke (curl) error:', err.message || err);
  process.exit(1);
}

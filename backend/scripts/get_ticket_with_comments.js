// Uses global fetch available in Node 18+
(async () => {
  try {
    const base = 'http://localhost:5000/api';

    // login
    const loginResp = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@wyze.com', password: 'password123' }),
    });
    const loginBody = await loginResp.json().catch(() => null);
    if (!loginBody || !loginBody.token) {
      console.error('Login failed:', loginBody);
      process.exit(1);
    }
    const token = loginBody.token;

    // fetch ticket
    const id = process.argv[2] || '1';
    console.log(`Fetching ticket ${id}...`);
    const ticketResp = await fetch(`${base}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const ticketBody = await ticketResp.json().catch(() => null);
    console.log('Status:', ticketResp.status);
    console.log('Body:', JSON.stringify(ticketBody, null, 2));

    // Validate shape: must include comments (array) and creator information
    if (ticketResp.status === 200 && ticketBody && Array.isArray(ticketBody.comments) && ticketBody.creator) {
      console.log('Ticket verification OK: comments field present and creator included.');
      // set exit code and schedule a clean exit to avoid libuv assertion on some Node builds
      process.exitCode = 0;
      setTimeout(() => process.exit(0), 50);
      return;
    }

    console.error('Ticket verification failed: expected comments array and creator object in response.');
    process.exitCode = 2;
    setTimeout(() => process.exit(2), 50);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

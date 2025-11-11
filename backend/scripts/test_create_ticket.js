(async () => {
  try {
    const base = 'http://localhost:5000/api';

    console.log('Logging in as employee...');
    let loginResp = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@wyze.com', password: 'password123' }),
    });
    console.log('Login status:', loginResp.status);
    let loginBody = await (async () => { try { return await loginResp.json(); } catch(e) { return null } })();
    console.log('Login body:', loginBody);
    if (!loginBody || !loginBody.token) {
      console.log('Attempting to register employee (will be no-op if exists)...');
      const regResp = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Employee User', email: 'employee@wyze.com', password: 'password123', role: 'employee' }),
      });
      console.log('Register status:', regResp.status);
      const regBody = await (async () => { try { return await regResp.json(); } catch(e) { return null } })();
      console.log('Register body:', regBody);
      // try login again
      loginResp = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee@wyze.com', password: 'password123' }),
      });
      loginBody = await (async () => { try { return await loginResp.json(); } catch(e) { return null } })();
      console.log('Login (after register) status:', loginResp.status);
      console.log('Login (after register) body:', loginBody);
    }
    const token = loginBody && loginBody.token;
    if (!token) {
      console.error('No token from login; aborting');
      process.exit(1);
    }

    console.log('Creating ticket...');
    const createResp = await fetch(`${base}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'smoke test ticket', description: 'created by smoke script' }),
    });
    console.log('Create status:', createResp.status);
    const createBodyText = await createResp.text();
    try { console.log('Create body (parsed):', JSON.parse(createBodyText)); } catch (e) { console.log('Create body (raw):', createBodyText); }
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();

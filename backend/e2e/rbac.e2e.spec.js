import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

test.describe('IT Support System E2E', () => {
  const timestamp = Date.now();
  const employeeEmail = `e2e-employee-${timestamp}@wyze.com`;
  const itStaffEmail = `e2e-it-${timestamp}@wyze.com`;
  const managerEmail = `e2e-manager-${timestamp}@wyze.com`;

  test('complete flow: register → verify → login → create ticket → assign → comment', async ({ request }) => {
    // 1. Register three users (employee, IT staff, manager)
    const regEmployee = await request.post(`${BASE_URL}/auth/register`, {
      data: { name: 'E2E Employee', email: employeeEmail, password: 'password123', role: 'employee' },
    });
    expect(regEmployee.status()).toBe(201);
    const empRegData = await regEmployee.json();
    const empVerificationCode = empRegData.verificationCode; // Available in non-production

    const regIT = await request.post(`${BASE_URL}/auth/register`, {
      data: { name: 'E2E IT Staff', email: itStaffEmail, password: 'password123', role: 'it_staff' },
    });
    expect(regIT.status()).toBe(201);
    const itRegData = await regIT.json();
    const itVerificationCode = itRegData.verificationCode;

    const regManager = await request.post(`${BASE_URL}/auth/register`, {
      data: { name: 'E2E Manager', email: managerEmail, password: 'password123', role: 'manager' },
    });
    expect(regManager.status()).toBe(201);
    const mgrRegData = await regManager.json();
    const mgrVerificationCode = mgrRegData.verificationCode;

    // 2. Verify emails
    const verifyEmp = await request.post(`${BASE_URL}/auth/verify`, {
      data: { email: employeeEmail, code: empVerificationCode },
    });
    expect(verifyEmp.status()).toBe(200);

    const verifyIT = await request.post(`${BASE_URL}/auth/verify`, {
      data: { email: itStaffEmail, code: itVerificationCode },
    });
    expect(verifyIT.status()).toBe(200);

    const verifyMgr = await request.post(`${BASE_URL}/auth/verify`, {
      data: { email: managerEmail, code: mgrVerificationCode },
    });
    expect(verifyMgr.status()).toBe(200);

    // 3. Login all users
    const loginEmp = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: employeeEmail, password: 'password123' },
    });
    expect(loginEmp.status()).toBe(200);
    const empLogin = await loginEmp.json();
    const empToken = empLogin.token;
    expect(empLogin.user.role).toBe('employee');

    const loginIT = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: itStaffEmail, password: 'password123' },
    });
    expect(loginIT.status()).toBe(200);
    const itLogin = await loginIT.json();
    const itToken = itLogin.token;
    const itUserId = itLogin.user.id;

    const loginMgr = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: managerEmail, password: 'password123' },
    });
    expect(loginMgr.status()).toBe(200);
    const mgrLogin = await loginMgr.json();
    const mgrToken = mgrLogin.token;

    // 4. Employee creates a ticket
    const createTicket = await request.post(`${BASE_URL}/tickets`, {
      data: {
        title: 'E2E Test Ticket',
        description: 'Created by Playwright E2E test',
        priority: 'high',
        slaCategory: 'standard',
        department: 'IT',
      },
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(createTicket.status()).toBe(201);
    const ticketData = await createTicket.json();
    const ticketId = ticketData.ticket.id;

    // 5. Employee should NOT be able to get all tickets (RBAC enforcement)
    const allByEmp = await request.get(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    expect(allByEmp.status()).toBe(403);

    // 6. IT Staff can assign ticket to themselves
    const assignTicket = await request.put(`${BASE_URL}/tickets/${ticketId}/assign`, {
      data: { assignedTo: itUserId },
      headers: { Authorization: `Bearer ${itToken}` },
    });
    expect(assignTicket.status()).toBe(200);
    const assignData = await assignTicket.json();
    expect(assignData.ticket.assignedTo).toBe(itUserId);
    expect(assignData.ticket.status).toBe('assigned');

    // 7. IT Staff updates ticket status
    const updateStatus = await request.put(`${BASE_URL}/tickets/${ticketId}/status`, {
      data: { status: 'in_progress' },
      headers: { Authorization: `Bearer ${itToken}` },
    });
    expect(updateStatus.status()).toBe(200);

    // 8. Add comment to ticket
    const addComment = await request.post(`${BASE_URL}/tickets/${ticketId}/comments`, {
      data: { content: 'Working on this issue now' },
      headers: { Authorization: `Bearer ${itToken}` },
    });
    expect(addComment.status()).toBe(201);

    // 9. Get ticket with comments
    const getTicket = await request.get(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${itToken}` },
    });
    expect(getTicket.status()).toBe(200);
    const ticketDetails = await getTicket.json();
    expect(ticketDetails.comments.length).toBeGreaterThan(0);
    expect(ticketDetails.status).toBe('in_progress');

    // 10. Manager can view stats
    const getStats = await request.get(`${BASE_URL}/tickets/stats`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    expect(getStats.status()).toBe(200);
    const stats = await getStats.json();
    expect(stats.total).toBeGreaterThan(0);

    // 11. Manager can view all tickets
    const getAllTickets = await request.get(`${BASE_URL}/tickets/all`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    expect(getAllTickets.status()).toBe(200);
    const allTickets = await getAllTickets.json();
    expect(allTickets.length).toBeGreaterThan(0);

    // 12. Resolve the ticket
    const resolveTicket = await request.put(`${BASE_URL}/tickets/${ticketId}/status`, {
      data: { status: 'resolved' },
      headers: { Authorization: `Bearer ${itToken}` },
    });
    expect(resolveTicket.status()).toBe(200);
    const resolvedData = await resolveTicket.json();
    expect(resolvedData.ticket.closedAt).not.toBeNull();
  });

  test('RBAC enforcement: employee cannot assign tickets', async ({ request }) => {
    const empEmail = `emp-rbac-${Date.now()}@wyze.com`;
    
    // Register and verify employee
    const reg = await request.post(`${BASE_URL}/auth/register`, {
      data: { name: 'RBAC Test Employee', email: empEmail, password: 'password123', role: 'employee' },
    });
    const regData = await reg.json();
    
    await request.post(`${BASE_URL}/auth/verify`, {
      data: { email: empEmail, code: regData.verificationCode },
    });

    const login = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: empEmail, password: 'password123' },
    });
    const loginData = await login.json();
    const token = loginData.token;

    // Create a ticket
    const create = await request.post(`${BASE_URL}/tickets`, {
      data: { title: 'RBAC Test', description: 'test' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const ticketData = await create.json();
    const ticketId = ticketData.ticket.id;

    // Try to assign (should fail with 403)
    const assign = await request.put(`${BASE_URL}/tickets/${ticketId}/assign`, {
      data: { assignedTo: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(assign.status()).toBe(403);
  });

  test('verification required: unverified user cannot login', async ({ request }) => {
    const unverifiedEmail = `unverified-${Date.now()}@wyze.com`;
    
    // Register but don't verify
    await request.post(`${BASE_URL}/auth/register`, {
      data: { name: 'Unverified User', email: unverifiedEmail, password: 'password123', role: 'employee' },
    });

    // Try to login without verification (should fail with 403)
    const login = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: unverifiedEmail, password: 'password123' },
    });
    expect(login.status()).toBe(403);
    const loginData = await login.json();
    expect(loginData.message).toContain('verify');
  });
});

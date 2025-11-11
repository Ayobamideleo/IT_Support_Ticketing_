# User & Role Management Module

## Overview
Complete implementation of an **Account & Role Management** system that transforms the IT Support Ticketing System into a full **IT Service Management (ITSM)** platform. This module allows Managers and IT Staff to create, manage, and control user accounts directly from the web interface.

---

## Features Implemented

### 🔐 Backend API Endpoints

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `GET /api/users` | GET | Manager, IT Staff | List all users with pagination and filters |
| `GET /api/users/stats` | GET | Manager | Get user statistics (total, active, inactive, role breakdown) |
| `GET /api/users/:id` | GET | Manager, IT Staff | Get user details by ID |
| `POST /api/users` | POST | Manager, IT Staff | Create new user account |
| `PUT /api/users/:id/role` | PUT | Manager only | Update user role |
| `PUT /api/users/:id/status` | PUT | Manager, IT Staff | Activate/deactivate user |
| `DELETE /api/users/:id` | DELETE | Manager only | Delete user account |
| `POST /api/users/:id/resend` | POST | Manager, IT Staff | Resend verification email |

### 🎯 Role-Based Permissions

#### Manager Capabilities
- ✅ Create accounts with any role (employee, it_staff, manager)
- ✅ View all users across all departments
- ✅ Change user roles
- ✅ Activate/deactivate any user (except self)
- ✅ Delete users (except self)
- ✅ Resend verification emails
- ✅ View user statistics and analytics
- ✅ Export user data to CSV

#### IT Staff Capabilities
- ✅ Create employee accounts only
- ✅ View users (optionally filtered by department)
- ✅ Activate/deactivate employees
- ✅ Resend verification emails
- ❌ Cannot change roles
- ❌ Cannot delete users
- ❌ Cannot manage manager accounts

### 🔒 Security Safeguards

1. **Self-Protection**
   - Users cannot change their own role
   - Users cannot deactivate themselves
   - Users cannot delete themselves

2. **Role Hierarchy**
   - IT Staff cannot create non-employee accounts
   - IT Staff cannot deactivate managers
   - IT Staff cannot delete any accounts

3. **Data Validation**
   - Email format validation (Zod schema)
   - Password minimum 8 characters
   - Role enum validation
   - Required fields enforcement

4. **Audit Trail**
   - `createdBy` field tracks who created each account
   - `lastLoginAt` tracks user activity
   - Console logging for verification actions

---

## Database Schema Changes

### User Model Extensions

```javascript
// New fields added to User model
department: { type: DataTypes.STRING, allowNull: true },
lastLoginAt: { type: DataTypes.DATE, allowNull: true },
createdBy: { type: DataTypes.INTEGER, allowNull: true }
```

### Migration
- **File**: `backend/migrations/20251110-add-user-management-fields.js`
- **Adds**: department, lastLoginAt, createdBy columns to Users table
- **Reversible**: Down migration removes these columns

---

## Frontend Implementation

### Manager: `/manager/accounts`
**File**: `frontend/src/pages/ManageAccounts.jsx`

#### Features
- **Statistics Dashboard**
  - Total users count
  - Active users count
  - Inactive users count
  - Verification percentage

- **User Management Table**
  - Columns: ID, Name, Email, Role, Status, Department, Last Login, Actions
  - Inline role selection dropdown
  - Toggle switch for active/inactive status
  - Resend verification button (for unverified users)
  - Delete button (with confirmation modal)

- **Filters**
  - Search by name or email
  - Filter by role (employee, it_staff, manager)
  - Filter by status (active, inactive)
  - Real-time filtering with API calls

- **Create User Modal**
  - Fields: Name, Email, Password, Role, Department
  - Form validation
  - Password minimum 8 characters
  - Role dropdown with all options

- **Export Functionality**
  - Export visible users to CSV
  - Includes all user fields
  - Timestamped filename

- **Pagination**
  - 20 users per page
  - Previous/Next navigation
  - Page counter
  - "Showing X to Y of Z" indicator

#### Security Features
- Current user cannot modify their own role
- Current user cannot deactivate themselves
- Current user cannot delete themselves
- Delete confirmation modal

### IT Staff: `/it/accounts`
**File**: `frontend/src/pages/ITUserAccounts.jsx`

#### Features
- **User Table** (Employee accounts only)
  - Columns: ID, Name, Email, Status, Department, Last Login, Actions
  - Toggle switch for active/inactive
  - Resend verification button

- **Filters**
  - Search by name or email
  - Filter by status (active, inactive)

- **Create Employee Modal**
  - Fields: Name, Email, Password, Department
  - Role fixed to "employee"
  - Form validation

- **Pagination**
  - 20 users per page
  - Full pagination controls

#### Limitations
- Only sees employee accounts
- Cannot change roles
- Cannot delete accounts
- Cannot manage managers or other IT staff

### Navigation Integration

#### IT Dashboard
- **Button**: "User Accounts" (top-right corner)
- **Icon**: Users group icon
- **Link**: `/it/accounts`

#### Manager Dashboard
- **Button**: "Manage Accounts" (next to Export CSV)
- **Icon**: Users group icon
- **Link**: `/manager/accounts`

---

## API Request/Response Examples

### Create User
```javascript
POST /api/users
Authorization: Bearer <token>

{
  "name": "John Doe",
  "email": "john@wyze.com",
  "password": "securepass123",
  "role": "employee",
  "department": "Sales"
}

Response:
{
  "message": "User created successfully",
  "user": {
    "id": 5,
    "name": "John Doe",
    "email": "john@wyze.com",
    "role": "employee",
    "department": "Sales",
    "isVerified": false,
    "createdBy": 1
  }
}
```

### List Users
```javascript
GET /api/users?page=1&limit=20&role=employee&status=active&q=john
Authorization: Bearer <token>

Response:
{
  "results": [
    {
      "id": 5,
      "name": "John Doe",
      "email": "john@wyze.com",
      "role": "employee",
      "department": "Sales",
      "isVerified": true,
      "lastLoginAt": "2025-11-10T14:30:00Z",
      "createdAt": "2025-11-10T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### Update Role
```javascript
PUT /api/users/5/role
Authorization: Bearer <token>

{
  "role": "it_staff"
}

Response:
{
  "message": "User role updated successfully",
  "user": { ...updated user object... }
}
```

### Get Statistics
```javascript
GET /api/users/stats
Authorization: Bearer <token>

Response:
{
  "total": 47,
  "active": 42,
  "inactive": 5,
  "verified": 39,
  "roleBreakdown": [
    { "role": "employee", "count": 40 },
    { "role": "it_staff", "count": 5 },
    { "role": "manager", "count": 2 }
  ]
}
```

---

## Validation Schemas (Zod)

### Create User
```javascript
{
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'it_staff', 'manager']).optional().default('employee'),
  department: z.string().max(50).optional().nullable()
}
```

### Update Role
```javascript
{
  role: z.enum(['employee', 'it_staff', 'manager'])
}
```

### Update Status
```javascript
{
  isVerified: z.boolean()
}
```

### Query Filters
```javascript
{
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  role: z.enum(['employee', 'it_staff', 'manager']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  department: z.string().max(50).optional(),
  q: z.string().max(100).optional()
}
```

---

## Files Created/Modified

### Backend Files Created
1. `backend/controllers/userController.js` - User management business logic
2. `backend/routes/userRoutes.js` - User API endpoint definitions
3. `backend/middleware/userValidation.js` - Zod validation schemas
4. `backend/migrations/20251110-add-user-management-fields.js` - Database migration

### Backend Files Modified
1. `backend/models/User.js` - Added department, lastLoginAt, createdBy fields
2. `backend/server.js` - Registered `/api/users` routes
3. `backend/controllers/authController.js` - Added lastLoginAt tracking on login

### Frontend Files Created
1. `frontend/src/pages/ManageAccounts.jsx` - Manager account management page
2. `frontend/src/pages/ITUserAccounts.jsx` - IT staff account management page

### Frontend Files Modified
1. `frontend/src/App.jsx` - Added routes for /manager/accounts and /it/accounts
2. `frontend/src/pages/ITDashboard.jsx` - Added "User Accounts" navigation button
3. `frontend/src/pages/ManagerDashboard.jsx` - Added "Manage Accounts" navigation button

---

## Testing Checklist

### Backend Tests
- [ ] List users with pagination
- [ ] Filter users by role
- [ ] Filter users by status
- [ ] Search users by name/email
- [ ] Create user as Manager (all roles)
- [ ] Create user as IT Staff (employee only)
- [ ] IT Staff cannot create manager
- [ ] Update user role as Manager
- [ ] IT Staff cannot update roles
- [ ] Activate/deactivate user
- [ ] Cannot deactivate self
- [ ] IT Staff cannot deactivate managers
- [ ] Delete user as Manager
- [ ] IT Staff cannot delete users
- [ ] Cannot delete self
- [ ] Resend verification email
- [ ] Get user statistics
- [ ] Last login timestamp updated on login

### Frontend Tests
- [ ] Manager can access /manager/accounts
- [ ] IT Staff can access /it/accounts
- [ ] Employees cannot access either page
- [ ] Statistics cards display correctly
- [ ] User table loads and displays data
- [ ] Filters work correctly
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Create user modal opens and submits
- [ ] Role dropdown works (Manager only)
- [ ] Status toggle works
- [ ] Delete confirmation modal works
- [ ] Resend verification button works
- [ ] CSV export works
- [ ] Cannot modify self
- [ ] Navigation buttons work

---

## Usage Workflows

### Workflow 1: Manager Creates IT Staff Account
1. Manager logs in and navigates to Dashboard
2. Clicks "Manage Accounts" button
3. Clicks "Create Account" button
4. Fills form:
   - Name: "Alice Smith"
   - Email: "alice@wyze.com"
   - Password: "securepass123"
   - Role: "IT Staff"
   - Department: "IT"
5. Clicks "Create Account"
6. New user appears in table with "Inactive" status
7. Manager clicks "Resend" to send verification email
8. Alice verifies email and status changes to "Active"

### Workflow 2: IT Staff Creates Employee Account
1. IT Staff logs in and navigates to Dashboard
2. Clicks "User Accounts" button
3. Clicks "Create Employee Account"
4. Fills form (role fixed to Employee):
   - Name: "Bob Johnson"
   - Email: "bob@wyze.com"
   - Password: "password123"
   - Department: "Sales"
5. Clicks "Create Account"
6. New employee appears in table

### Workflow 3: Manager Changes User Role
1. Manager opens Manage Accounts page
2. Finds user in table
3. Selects new role from dropdown
4. Role updates immediately via API
5. User's permissions change on next login

### Workflow 4: Deactivate Inactive User
1. Manager/IT Staff opens accounts page
2. Finds inactive user
3. Toggles status switch to "Inactive"
4. User cannot log in until reactivated

---

## Security Considerations

### Password Handling
- Passwords hashed with bcrypt (10 rounds)
- Minimum 8 characters enforced
- Never returned in API responses

### Authorization
- All routes require authentication
- Role-based middleware checks permissions
- 403 Forbidden for insufficient permissions
- 401 Unauthorized for missing token

### Input Validation
- Zod schemas validate all inputs
- SQL injection prevented by Sequelize ORM
- XSS prevented by React escaping

### Rate Limiting
- Authentication endpoints rate-limited
- Prevents brute force attacks

---

## Future Enhancements

### Optional Features
1. **Audit Logging**
   - Create AuditLog model
   - Track all user management actions
   - Show audit trail in UI

2. **Bulk Operations**
   - Bulk user import from CSV
   - Bulk role changes
   - Bulk deactivation

3. **Advanced Filters**
   - Filter by creation date
   - Filter by last login date
   - Filter by creator

4. **User Profiles**
   - Profile pictures
   - Phone numbers
   - Additional metadata

5. **Password Reset**
   - Admin-initiated password reset
   - Temporary passwords
   - Force password change on next login

6. **Email Notifications**
   - Welcome emails
   - Account activation notifications
   - Role change notifications

7. **Department Management**
   - Department hierarchy
   - Department-based access control
   - Department statistics

8. **Activity Monitoring**
   - Login history
   - Session management
   - Active sessions view

---

## Deployment Notes

### Backend Deployment
1. Run migration: `npm run migrate`
2. Restart backend server
3. Verify `/api/users` endpoint accessible
4. Check logs for any errors

### Frontend Deployment
1. Rebuild frontend: `npm run build`
2. Deploy static files
3. Verify new routes work
4. Test navigation buttons

### Database
- Migration adds new columns (non-breaking)
- Existing users get NULL for new fields
- No data loss

---

## Troubleshooting

### Common Issues

**Issue**: "Access denied. Insufficient permissions"
- **Cause**: User role doesn't have permission
- **Fix**: Check user role in token, verify middleware

**Issue**: "User with this email already exists"
- **Cause**: Duplicate email in database
- **Fix**: Use different email or delete existing user

**Issue**: "Failed to create user"
- **Cause**: Validation error or database issue
- **Fix**: Check console logs, verify form inputs

**Issue**: Navigation button not showing
- **Cause**: User role not recognized
- **Fix**: Verify user role in AuthContext

**Issue**: Cannot change own role
- **Cause**: Security safeguard preventing self-modification
- **Fix**: Have another manager change the role

---

## API Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | User doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server/database error |

---

## Conclusion

The User & Role Management module is now fully integrated into the WYZE IT Support System, providing comprehensive account administration capabilities with proper role-based access control, security safeguards, and an intuitive user interface. This transforms the system from a basic ticketing tool into a professional ITSM platform.

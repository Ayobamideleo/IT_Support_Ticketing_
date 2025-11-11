# Email Verification Implementation

## Overview
Email verification is now required for all new user registrations. Users must verify their email address using a 6-digit code before they can log in.

## Backend Changes

### User Model (`backend/models/User.js`)
Added three fields:
- `isVerified` (BOOLEAN, default: false)
- `verificationCode` (STRING, nullable)
- `verificationExpires` (DATE, nullable)

### Auth Controller (`backend/controllers/authController.js`)
- **registerUser**: Generates a 6-digit verification code, sets 15-minute expiration, logs code to console (dev), and returns it in non-production responses
- **verifyUser**: New endpoint to verify the code and mark user as verified
- **loginUser**: Now blocks login if `isVerified` is false (returns 403)

### Routes (`backend/routes/authRoutes.js`)
 Added: `POST /api/auth/verify` → verifyUser
 Added: `POST /api/auth/resend` → resendVerification (with in-memory cooldown + hourly cap)

### Database Migrations
 Persist resend rate limiting to Redis (current is in-memory)
 Email provider integration (SendGrid/Postmark/SES)
 Rate limiting on verification attempts
 Email template customization
- Run with: `npm run migrate:umzug`

## Frontend Changes

### New Page: `frontend/src/pages/VerifyEmail.jsx`
- Prompts user to enter the 6-digit verification code
- Displays the code in dev mode (when passed via navigation state)
- Calls `POST /api/auth/verify` with email + code
- Redirects to login on success

### Updated Registration Flow (`frontend/src/pages/Register.jsx`)
- After successful registration, navigates to `/verify-email` with:
  - User's email
  - Verification code (in non-production environments for testing)

### Routing (`frontend/src/App.jsx`)
- Added route: `/verify-email` → VerifyEmail component

## CI/CD Changes

### GitHub Actions (`. github/workflows/postman-rbac.yml`)
- Added migration step before running Newman tests
- Ensures database schema is up-to-date in CI environment
- Uses environment variables or fallback defaults

### New npm Script (`backend/package.json`)
- `npm run list:migrations` - Lists all executed migrations from SequelizeMeta table

## Testing the Flow

### Local Development
1. Register a new user at `/register`
2. Check backend console for verification code (6-digit number)
3. The code is also displayed on the verification page in dev mode
4. Enter the code on the verification page
5. Login with the verified account

### Production Setup
For production, integrate an email service:
- SendGrid
- Postmark
- AWS SES
- Mailgun

Add to `backend/controllers/authController.js` in the `registerUser` function:
```javascript
// Send verification email (production)
if (process.env.NODE_ENV === 'production') {
  await emailService.sendVerificationEmail(email, verificationCode);
}
```

Required environment variables:
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM_ADDRESS`

## Verification Code Details
- **Length**: 6 digits
- **Expiration**: 15 minutes
- **Generation**: Cryptographically secure random (crypto.randomInt)
- **Security**: Code is cleared after successful verification

## Migration Commands
```bash
# Run all pending migrations
npm run migrate:umzug

# List executed migrations
npm run list:migrations

# Check database connectivity
npm run smoke:db
```

## API Endpoints

### POST /api/auth/register
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@wyze.com",
  "password": "password123",
  "role": "employee"
}
```

**Response (non-production):**
```json
{
  "token": "jwt-token...",
  "user": { "id": 1, "email": "john@wyze.com", "role": "employee", "isVerified": false },
  "verificationCode": "123456"
}
```

### POST /api/auth/verify
**Request:**
```json
{
  "email": "john@wyze.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

### POST /api/auth/login
**Behavior:**
- Returns 403 if user is not verified
- Returns JWT token if verified

## Security Notes
- Verification codes expire after 15 minutes
- Codes are cleared from database after successful verification
- Login is blocked until email is verified
- Codes are only returned in API responses when `NODE_ENV !== 'production'`

## Future Enhancements
- Resend verification code functionality
- Rate limiting on verification attempts
- Email template customization
- SMS verification as alternative

# Azure AD Integration Plan for WYZE IT Support System

## Overview
This document outlines the plan for integrating Azure Active Directory (Azure AD / Microsoft Entra ID) authentication into the WYZE IT Support System to enable company email-based authentication.

## Objectives
- Enable employees to sign in with their corporate Microsoft 365 / Azure AD accounts
- Eliminate need for separate password management
- Leverage existing company identity infrastructure
- Maintain role-based access control (RBAC) within the application
- Support both Azure AD and local auth for flexibility during transition

## Authentication Flow

### OAuth 2.0 / OpenID Connect Flow
1. User clicks "Sign in with Microsoft" button
2. Application redirects to Microsoft identity platform
3. User authenticates with their company credentials (email@wyze.com)
4. Microsoft redirects back with authorization code
5. Backend exchanges code for access token and ID token
6. Backend validates token and extracts user information
7. Backend creates/updates user record and issues JWT token
8. Frontend stores JWT token and proceeds to dashboard

## Technical Implementation

### Backend Dependencies
```bash
npm install @azure/msal-node passport passport-azure-ad dotenv
```

### Required Environment Variables
Add to `.env`:
```env
# Azure AD Configuration
AZURE_AD_CLIENT_ID=<your-app-client-id>
AZURE_AD_CLIENT_SECRET=<your-app-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_REDIRECT_URI=http://localhost:5000/api/auth/azure/callback
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/<tenant-id>

# Optional: For production
AZURE_AD_REDIRECT_URI_PROD=https://your-domain.com/api/auth/azure/callback
```

### Backend Code Changes

#### 1. Azure AD Passport Strategy (`backend/config/azureADStrategy.js`)
```javascript
import { OIDCStrategy } from 'passport-azure-ad';

const azureStrategy = new OIDCStrategy(
  {
    identityMetadata: `${process.env.AZURE_AD_AUTHORITY}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    responseType: 'code',
    responseMode: 'form_post',
    redirectUrl: process.env.AZURE_AD_REDIRECT_URI,
    allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
    validateIssuer: true,
    passReqToCallback: false,
    scope: ['profile', 'email', 'openid'],
  },
  async (iss, sub, profile, accessToken, refreshToken, done) => {
    try {
      // Extract user info from Azure AD profile
      const email = profile._json.email || profile._json.preferred_username;
      const name = profile.displayName;
      
      // Find or create user in database
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Create new user with default role (employee)
        // Admin can update role later
        user = await User.create({
          name,
          email,
          role: 'employee',
          isVerified: true, // Azure AD users are pre-verified
          password: null, // No password for Azure AD users
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
);

export default azureStrategy;
```

#### 2. Auth Routes (`backend/routes/authRoutes.js`)
Add Azure AD routes:
```javascript
import passport from 'passport';

// Initiate Azure AD login
router.get('/azure/login', passport.authenticate('azuread-openidconnect'));

// Azure AD callback
router.post(
  '/azure/callback',
  passport.authenticate('azuread-openidconnect', { session: false }),
  async (req, res) => {
    try {
      // Generate JWT token for the user
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);
```

#### 3. User Model Update (`backend/models/User.js`)
Modify User model to support Azure AD:
```javascript
password: {
  type: DataTypes.STRING,
  allowNull: true, // Allow null for Azure AD users
},
azureAdId: {
  type: DataTypes.STRING,
  allowNull: true,
  unique: true,
},
authProvider: {
  type: DataTypes.ENUM('local', 'azure_ad'),
  defaultValue: 'local',
},
```

### Frontend Code Changes

#### 1. Login Page (`frontend/src/pages/Login.jsx`)
Add Azure AD login button:
```jsx
const handleAzureLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/azure/login`;
};

// Add button in login form:
<button
  type="button"
  onClick={handleAzureLogin}
  className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
>
  <img src="/microsoft-logo.svg" alt="Microsoft" className="w-5 h-5" />
  Sign in with Microsoft
</button>
```

#### 2. Auth Callback Handler (`frontend/src/pages/AuthCallback.jsx`)
```jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=azure_auth_failed');
    } else if (token) {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      login(token, { id: payload.id, email: payload.email, role: payload.role });
      
      // Redirect based on role
      if (payload.role === 'manager') navigate('/manager');
      else if (payload.role === 'it_staff') navigate('/it');
      else navigate('/employee');
    }
  }, []);

  return <div>Completing authentication...</div>;
}
```

## Azure AD Portal Setup

### 1. App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory → App registrations
3. Click "New registration"
4. Name: "WYZE IT Support System"
5. Supported account types: "Accounts in this organizational directory only"
6. Redirect URI: 
   - Type: Web
   - URI: `http://localhost:5000/api/auth/azure/callback`
7. Click "Register"

### 2. Configure Authentication
1. Go to "Authentication" section
2. Add redirect URI for production: `https://your-domain.com/api/auth/azure/callback`
3. Enable "ID tokens" under Implicit grant
4. Save changes

### 3. Create Client Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "WYZE IT Support Secret"
4. Expires: 24 months (recommended)
5. Click "Add"
6. **Copy the secret value immediately** (won't be shown again)

### 4. API Permissions
1. Go to "API permissions"
2. Ensure these Microsoft Graph permissions are granted:
   - `User.Read` (default)
   - `email`
   - `openid`
   - `profile`
3. Click "Grant admin consent" (requires admin privileges)

### 5. Note Important Values
Copy these values to your `.env` file:
- Application (client) ID → `AZURE_AD_CLIENT_ID`
- Directory (tenant) ID → `AZURE_AD_TENANT_ID`
- Client secret value → `AZURE_AD_CLIENT_SECRET`

## Role Mapping Strategy

### Option 1: Manual Role Assignment (Recommended for MVP)
- All Azure AD users start as "employee" role
- Managers/IT staff manually update user roles in the database
- Simple but requires manual work

### Option 2: Azure AD Group-Based Mapping
- Create Azure AD groups: "WYZE-IT-Staff", "WYZE-Managers"
- Map groups to roles in application:
  ```javascript
  const roleMapping = {
    'group-id-for-it-staff': 'it_staff',
    'group-id-for-managers': 'manager',
  };
  ```
- Requires additional Graph API permissions (`GroupMember.Read.All`)

### Option 3: Custom Attribute in Azure AD
- Use Azure AD extension attributes or custom claims
- Sync role information from HR system to Azure AD
- Most automated but requires Azure AD Premium

## Security Considerations

1. **Token Validation**
   - Validate JWT signature using Azure AD public keys
   - Check issuer (`iss`) matches your tenant
   - Verify audience (`aud`) matches your client ID
   - Check token expiration (`exp`)

2. **Redirect URI Whitelist**
   - Only allow approved redirect URIs in Azure AD
   - Use HTTPS in production

3. **State Parameter**
   - Use CSRF protection with state parameter
   - Validate state on callback

4. **Secure Storage**
   - Store Azure AD credentials in environment variables
   - Never commit secrets to version control
   - Use Azure Key Vault in production

## Migration Strategy

### Phase 1: Dual Authentication (Recommended)
- Support both local auth (email/password) and Azure AD
- Allow gradual user migration
- Existing users keep current login method
- New users can choose Azure AD or local

### Phase 2: Azure AD Primary (Optional)
- Make Azure AD the default/only option
- Maintain local auth for external contractors
- Require admin approval for local accounts

## Development Workflow

### Local Development
1. Use Azure AD app registration with localhost redirect URI
2. Test with real company accounts (dev tenant recommended)
3. Set `allowHttpForRedirectUrl: true` for local testing

### Testing
1. Create test accounts in Azure AD (or use dev tenant)
2. Test role assignment flows
3. Verify token refresh and expiration handling

### Production Deployment
1. Update redirect URIs in Azure AD to production URLs
2. Use HTTPS only
3. Enable `validateIssuer` and all security checks
4. Monitor authentication metrics

## Cost Considerations
- **Azure AD Free**: Sufficient for basic authentication (up to 50,000 objects)
- **Azure AD Premium P1**: Required for conditional access, group-based provisioning
- **Azure AD Premium P2**: Advanced security features

For WYZE IT Support System, **Azure AD Free** is sufficient for initial implementation.

## Rollback Plan
If issues arise:
1. Keep local authentication enabled
2. Users can switch back to email/password
3. Azure AD integration can be disabled via environment variable:
   ```env
   ENABLE_AZURE_AD=false
   ```

## Next Steps
1. ✅ Get Azure AD tenant admin approval
2. ✅ Create app registration in Azure Portal
3. ✅ Install required npm packages
4. ✅ Implement backend Azure AD strategy
5. ✅ Add frontend "Sign in with Microsoft" button
6. ✅ Test with development accounts
7. ✅ Document setup for team
8. ✅ Deploy to staging environment
9. ✅ Pilot with small user group
10. ✅ Roll out to all users

## Additional Resources
- [Microsoft Identity Platform Docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [passport-azure-ad GitHub](https://github.com/AzureAD/passport-azure-ad)
- [MSAL Node Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)

## Support Contacts
- Azure AD Admin: [IT Admin Email]
- Application Owner: [Your Email]
- Development Team: [Team Email]

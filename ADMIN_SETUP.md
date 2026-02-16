# Admin Setup Guide

## Initial Admin Account Creation

The Employee Tracker uses a role-based access control system. To get started, you need to create the initial admin account for **Manoj** at `manoj@skillariondevelopement.in`.

### Method 1: Using the Setup Page (Recommended)

1. Navigate to `http://localhost:3000/admin-setup` in your browser
2. Click "Create Admin Account"
3. Copy the temporary password securely
4. Go to the login page and log in with:
   - Email: `manoj@skillariondevelopement.in`
   - Password: (the temporary password from step 3)
5. Change your password immediately after login

### Method 2: Using the API Endpoint

Make a POST request to `/api/admin/setup`:

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "email": "manoj@skillariondevelopement.in",
  "tempPassword": "generatedSecurePassword",
  "userId": "uuid-here",
  "instructions": "Admin user should log in and change their password immediately."
}
```

### Method 3: Using the Server Action

If you have direct access to the server, you can import and call the setup function:

```typescript
import { setupAdminUser } from '@/scripts/setup-admin'

const result = await setupAdminUser()
console.log(result)
```

## Admin Capabilities After Setup

Once logged in as an admin, Manoj can:

- **User Approval**: Review and approve/reject new user signups
- **Task Management**: Create, assign, and verify employee tasks
- **Leave Approvals**: Review and approve/reject leave requests
- **Attendance Verification**: Verify manual attendance entries
- **Calendar Management**: Create company-wide and department events
- **Employee Reports**: View attendance, task, and performance reports
- **System Settings**: Manage user roles and permissions

## Security Notes

⚠️ **Important:**
- The temporary password is automatically generated and should be changed immediately after first login
- Only use the `/admin-setup` endpoint during initial setup - it will refuse to run if any admin already exists
- Never share temporary passwords over insecure channels
- The setup endpoint has built-in security checks to prevent unauthorized admin account creation

## Troubleshooting

### "Admin user already exists"
If you see this error, an admin account has already been created. If you need to reset, you'll need to manually delete the admin user's profile and auth records.

### Password reset
If the temporary password is lost, you can:
1. Use Supabase dashboard to reset the user's password
2. Or delete the user and run setup again

## Next Steps

After creating the admin account:
1. Log in to the admin panel
2. Create user roles and permissions as needed
3. Start approving employees through the "Pending Approval" tab
4. Create company events and configure leave policies

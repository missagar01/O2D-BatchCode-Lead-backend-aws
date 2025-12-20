# Fix PostgreSQL Authentication Error

## Problem
```
password authentication failed for user "postgres"
```

## Current Status
✅ **Oracle connection is working!** (Great news!)
❌ **PostgreSQL authentication is failing**

## Issues to Fix

### 1. JWT_SECRET is a Placeholder

Your `.env` has:
```bash
JWT_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET
```

This needs to be a real secret. Generate one:

**Windows PowerShell:**
```powershell
# Generate JWT secret
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

**Or use Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. PostgreSQL Password Verification

The password `Sagar00112233` might be incorrect. Verify:

1. **Check AWS RDS Console:**
   - Go to AWS RDS Console
   - Find your database: `database-2-mumbai.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com`
   - Verify the master username and password

2. **Test Connection Manually:**
   ```bash
   # Using psql (if installed)
   psql -h database-2-mumbai.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com -U postgres -d "Lead-To-Order" -p 5432
   ```

3. **Or use a PostgreSQL client** (pgAdmin, DBeaver, etc.) to test the connection

### 3. Update .env File

Update your `.env` file with these fixes:

```bash
# ================== POSTGRES (AWS RDS) ==================
DB_HOST=database-2-mumbai.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=Sagar00112233  # VERIFY THIS IS CORRECT
DB_NAME=Lead-To-Order
DB_PORT=5432
DB_SSL=true  # ADD THIS - Required for AWS RDS

# ================== LOGIN DATABASE (Same RDS) ==================
PG_HOST=database-2-mumbai.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com
PG_USER=postgres
PG_PASSWORD=Sagar00112233  # VERIFY THIS IS CORRECT
PG_NAME=checklist-delegation
PG_PORT=5432
PG_SSL=true  # ADD THIS - Required for AWS RDS

# ================== AUTH ==================
JWT_SECRET=PASTE_YOUR_GENERATED_SECRET_HERE  # REPLACE WITH REAL SECRET
JWT_EXPIRES_IN=30d
```

### 4. Common Issues

#### Issue A: Password Has Special Characters
If your password has special characters, they might need to be escaped or quoted in `.env`:

```bash
# If password has special chars, try quoting it:
DB_PASSWORD="Sagar00112233"
PG_PASSWORD="Sagar00112233"
```

#### Issue B: Password Changed in AWS
If the password was changed in AWS RDS but not updated in `.env`, update it:
1. Check AWS RDS Console for the current password
2. Or reset the password in AWS RDS Console
3. Update `.env` with the new password

#### Issue C: Wrong Username
The username might not be `postgres`. Check AWS RDS Console for the actual master username.

### 5. Test Connection

After updating `.env`, test the connection:

```bash
# Restart your server
# The logs should show successful connection
```

### 6. Security Reminder

⚠️ **IMPORTANT**: You've exposed passwords in chat logs. Please:
1. Change PostgreSQL password in AWS RDS Console
2. Change SSH password
3. Change Oracle password
4. Update all passwords in `.env` file
5. Regenerate AWS access keys if needed

## Quick Fix Checklist

- [ ] Generate real JWT_SECRET and replace placeholder
- [ ] Verify PostgreSQL password in AWS RDS Console
- [ ] Add `DB_SSL=true` and `PG_SSL=true` to `.env`
- [ ] Test connection manually (psql or client tool)
- [ ] Update `.env` with correct password if needed
- [ ] Restart server
- [ ] Verify connection in logs

## Expected Success Logs

After fixing, you should see:
```
✅ Postgres connection pool ready
✅ Main database connection established
✅ Auth database connection established
```


# Fix: Missing JWT_SECRET Error

## Problem
The server is crashing with this error:
```
ZodError: Invalid input: expected string, received undefined
path: ["JWT_SECRET"]
```

This means `JWT_SECRET` is missing from your `.env` file.

## Solution

### Step 1: Generate a Secure JWT Secret

On your AWS server, generate a secure random string:

```bash
# Option 1: Using openssl (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using /dev/urandom
head -c 32 /dev/urandom | base64
```

Copy the output (it will be a long random string).

### Step 2: Add to .env File

Edit your `.env` file:

```bash
nano .env
```

Add this line (replace `your-generated-secret-here` with the output from Step 1):

```bash
JWT_SECRET=your-generated-secret-here
```

Also add (optional, defaults to '1d'):
```bash
JWT_EXPIRES_IN=30d
```

Save and exit:
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 3: Restart PM2

```bash
pm2 restart o2d-lead-batch --update-env
pm2 logs o2d-lead-batch --lines 30
```

### Step 4: Verify

The server should start without the JWT_SECRET error. You should see:
```
🚀 Server running at http://localhost:3004
```

## Important Notes

1. **Security**: Use a strong, random secret. Don't use simple strings like "secret" or "password".

2. **Consistency**: All modules (batchcode, o2d, lead-to-order) must use the **same** `JWT_SECRET`. If you change it, all existing tokens will become invalid.

3. **Production**: In production, use a strong secret and keep it secure. Never commit it to version control.

## Example .env Entry

```bash
# JWT Configuration
JWT_SECRET=K8j3mN9pQ2rT5vX8yB1dF4gH7jK0mN3pQ6sT9vW2yZ5bC8eF1gH4jK7mN0pQ3
JWT_EXPIRES_IN=30d
```

## After Fixing JWT_SECRET

Once the server starts, you can continue with the Oracle Instant Client installation:
1. Check if Oracle Instant Client is installed: `ls -lah /opt/oracle`
2. If not installed, follow the steps in `INSTALLATION_STEPS.md`
3. Add `ORACLE_CLIENT=/opt/oracle/instantclient_XX_XX` to `.env`
4. Restart PM2 again


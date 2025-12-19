# Oracle O2D Module Connection Fix

## Problem
- Login endpoint (`/api/auth/login`) works (uses PostgreSQL)
- O2D Oracle endpoints (like `/api/o2d/dashboard/summary`) return 502 Bad Gateway
- CORS errors appear because server crashes before sending CORS headers

## Root Cause
The O2D module was configured to only work with SSH tunnel, but your AWS setup likely uses direct Oracle connection via `ORACLE_CONNECTION_STRING`.

## Solution Applied

### 1. Made O2D Module Support Both Connection Methods
The O2D module now supports:
- **Direct Connection**: Uses `ORACLE_CONNECTION_STRING` (like the root index.js)
- **SSH Tunnel**: Uses SSH tunnel if `SSH_HOST` is configured

### 2. Added Global Error Handler
Added error handler in `src/app.js` that ensures CORS headers are **always** sent, even when errors occur.

### 3. Improved Error Handling
- Better error messages in `getConnection()`
- Graceful error handling in dashboard service
- Connection errors now return proper JSON responses instead of crashing

## What You Need to Do on AWS

### Option 1: Use Direct Connection (Recommended)

1. **Edit your `.env` file:**
   ```bash
   nano .env
   ```

2. **Make sure you have these Oracle variables:**
   ```bash
   ORACLE_USER=your_username
   ORACLE_PASSWORD=your_password
   ORACLE_CONNECTION_STRING=your-oracle-host:1521/your-service
   ```

3. **Remove or comment out SSH tunnel variables** (if not needed):
   ```bash
   # SSH_HOST=...
   # SSH_USER=...
   # SSH_PASSWORD=...
   ```

4. **Restart PM2:**
   ```bash
   pm2 restart o2d-backend
   pm2 logs o2d-backend --lines 50
   ```

### Option 2: Use SSH Tunnel (If Oracle is behind firewall)

1. **Edit your `.env` file:**
   ```bash
   nano .env
   ```

2. **Set SSH tunnel variables:**
   ```bash
   ORACLE_USER=your_username
   ORACLE_PASSWORD=your_password
   SSH_HOST=your-ssh-server.com
   SSH_USER=ubuntu
   SSH_PASSWORD=your_ssh_password
   SSH_PORT=22
   ORACLE_HOST=127.0.0.1  # Oracle host on SSH server
   ORACLE_PORT=1521       # Oracle port on SSH server
   LOCAL_ORACLE_PORT=1521 # Local port for tunnel
   ```

3. **Restart PM2:**
   ```bash
   pm2 restart o2d-backend
   pm2 logs o2d-backend --lines 50
   ```

## Verification

After restarting, check the logs. You should see:

**For Direct Connection:**
```
✅ All required environment variables are set
🔧 Config: { connectionType: 'Direct Connection', ... }
🔗 Using direct connection: your-host:1521/your-service
✅ Oracle connection pool started
```

**For SSH Tunnel:**
```
✅ All required environment variables are set
🔧 Config: { connectionType: 'SSH Tunnel', ... }
🔐 Initializing SSH tunnel for Oracle...
✅ SSH tunnel ready for Oracle
🔗 Using SSH tunnel connection: 127.0.0.1:1521/ora11g
✅ Oracle connection pool started
```

## Testing

1. **Test the endpoint:**
   ```bash
   curl https://o2d-batch-lead.sagartmt.com/api/o2d/dashboard/summary \
     -H "Origin: http://localhost:5173" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -v
   ```

2. **Check for CORS headers in response:**
   You should see:
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Credentials: true
   ```

## Common Issues

### Still Getting 502 Bad Gateway?
1. Check that `ORACLE_CONNECTION_STRING` is set correctly
2. Verify Oracle is accessible from your AWS server
3. Check PM2 logs for Oracle connection errors
4. Ensure Oracle credentials are correct

### CORS Still Not Working?
1. Make sure `CORS_ORIGINS=*` or includes `http://localhost:5173` in `.env`
2. Restart PM2 after updating `.env`
3. Check that the global error handler is working (errors should still have CORS headers)

### Connection String Format
The `ORACLE_CONNECTION_STRING` should be in one of these formats:
- Service name: `hostname:port/service_name` (e.g., `oracle.example.com:1521/XEPDB1`)
- SID: `hostname:port:SID` (e.g., `oracle.example.com:1521:ORCL`)
- AWS RDS: `your-rds-endpoint.region.rds.amazonaws.com:1521/ORCL`

## Files Changed

1. `backend/src/app.js` - Added global error handler with CORS support
2. `backend/src/o2d/config/db.js` - Made connection method flexible (direct or SSH tunnel)
3. `backend/src/o2d/services/dashboard.service.js` - Improved error handling


# CORS Configuration Fix

## Problem
Frontend running on `http://localhost:5173` cannot access backend at `https://o2d-batch-lead.sagartmt.com` due to CORS policy blocking.

## Solution

### Option 1: Allow All Origins (Quick Fix - Development Only)
Add to your `.env` file on AWS:
```bash
CORS_ORIGINS=*
```
This allows all origins. **Not recommended for production**, but works for testing.

### Option 2: Allow Specific Origins (Recommended for Production)
Add to your `.env` file on AWS:
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://o2d-batch-lead.sagartmt.com
```
This allows:
- `http://localhost:5173` - Your local development frontend
- `http://localhost:3000` - Alternative local port
- `https://o2d-batch-lead.sagartmt.com` - Your production frontend domain

### Option 3: Production Only (Most Secure)
If you only want to allow the production frontend:
```bash
CORS_ORIGINS=https://o2d-batch-lead.sagartmt.com
```

## Steps to Fix on AWS

1. **SSH into your AWS server:**
   ```bash
   ssh ubuntu@your-aws-server
   ```

2. **Navigate to your project directory:**
   ```bash
   cd ~/actions-runner/_work/O2D-BatchCode-Lead-backend-aws/O2D-BatchCode-Lead-backend-aws
   ```

3. **Edit your .env file:**
   ```bash
   nano .env
   ```

4. **Add or update the CORS_ORIGINS line:**
   ```bash
   # For development + production (recommended)
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://o2d-batch-lead.sagartmt.com
   
   # OR for all origins (quick fix, less secure)
   CORS_ORIGINS=*
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Restart your PM2 process:**
   ```bash
   pm2 restart o2d-backend
   ```

7. **Check the logs to verify CORS is configured:**
   ```bash
   pm2 logs o2d-backend --lines 30
   ```
   
   You should see a line like:
   ```
   🔒 CORS Configuration: { enabled: true, allowedOrigins: 'ALL (*)' }
   ```

8. **Test the preflight request:**
   ```bash
   curl -X OPTIONS https://o2d-batch-lead.sagartmt.com/api/auth/login \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v
   ```
   
   You should see `Access-Control-Allow-Origin` in the response headers.

## What Was Fixed

1. ✅ Updated CORS configuration in `src/app.js` to properly handle multiple origins
2. ✅ Added proper CORS headers (methods, allowed headers, credentials)
3. ✅ Configured Helmet to work with CORS (cross-origin resource policy)
4. ✅ Updated o2d/app.js to use the same CORS configuration
5. ✅ Added documentation in ENV_VARIABLES.md

## Testing

After updating, test from your local frontend:

1. **Check browser console** - CORS errors should be gone
2. **Test API call:**
   ```javascript
   fetch('https://o2d-batch-lead.sagartmt.com/api/o2d/second-weight/pending?page=1&limit=50', {
     method: 'GET',
     headers: {
       'Content-Type': 'application/json',
     },
     credentials: 'include'
   })
   .then(res => res.json())
   .then(data => console.log(data))
   .catch(err => console.error('Error:', err));
   ```

## Common Issues

### Still Getting CORS Error?
1. Make sure you restarted PM2 after updating .env
2. Check that CORS_ORIGINS is set correctly (no extra spaces)
3. Verify the frontend URL matches exactly (including http/https and port)
4. Check browser console for the exact error message

### Frontend URL Mismatch
Make sure the origin in the error message exactly matches one in CORS_ORIGINS:
- ✅ `http://localhost:5173` matches `http://localhost:5173`
- ❌ `http://localhost:5173/` does NOT match `http://localhost:5173` (trailing slash)
- ❌ `https://localhost:5173` does NOT match `http://localhost:5173` (http vs https)

## Security Note

For production, it's recommended to:
1. Use specific origins instead of `*`
2. Only include the production frontend domain
3. Remove localhost origins in production if not needed

Example production .env:
```bash
CORS_ORIGINS=https://o2d-batch-lead.sagartmt.com
```


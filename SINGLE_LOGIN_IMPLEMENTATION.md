# Single Login Implementation Summary

## ✅ Changes Made

### 1. Removed Separate Login Endpoints

**Removed from:**
- ❌ `POST /api/batchcode/auth/login` - Removed
- ❌ `POST /api/o2d/auth/login` - Removed  
- ❌ `POST /api/lead-to-order/auth/login` - Removed

**Single Login Endpoint:**
- ✅ `POST /api/auth/login` - **Now used by all modules**

### 2. Updated Authentication Middleware

All modules now use the same `JWT_SECRET` from environment variables:

- **batchcode**: Updated to use `process.env.JWT_SECRET` (with fallback to config)
- **o2d**: Already using `process.env.JWT_SECRET` (added warning if not set)
- **lead-to-order**: Already using `process.env.JWT_SECRET` (added fallback)

### 3. Database Configuration

All modules now use the same database credentials from `.env` file:
- `DB_HOST` / `PG_HOST`
- `DB_USER` / `PG_USER`
- `DB_PASSWORD` / `PG_PASSWORD`
- `DB_NAME` / `PG_DATABASE`
- `DB_PORT` / `PG_PORT`

### 4. Files Modified

#### Routes Files:
- `src/batchcode/routes/auth.routes.js` - Removed login route
- `src/o2d/routes/auth.routes.js` - Removed login route
- `src/lead-to-order/routes/auth.routes.js` - Removed login route

#### Middleware Files:
- `src/batchcode/middlewares/auth.js` - Updated to use `process.env.JWT_SECRET`
- `src/o2d/middleware/auth.js` - Added warning for missing JWT_SECRET
- `src/lead-to-order/middleware/auth.js` - Added fallback for JWT_SECRET

#### Documentation:
- `README.md` - Updated all references to reflect single login

## 🔐 How It Works Now

1. **User Login**: 
   - User calls `POST /api/auth/login` with `{ username, password }`
   - Server validates against PostgreSQL `users` table
   - Returns JWT token signed with `JWT_SECRET`

2. **Token Usage**:
   - User includes token in `Authorization: Bearer <token>` header
   - All modules (batchcode, o2d, lead-to-order) validate the same token
   - All use the same `JWT_SECRET` from `.env`

3. **Database Access**:
   - All modules use the same database credentials from `.env`
   - Shared PostgreSQL connection pool
   - Same `users` table for authentication

## 📋 Environment Variables Required

Make sure your `.env` file has:

```env
# Database (used by all modules)
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=5432

# Or use PG_ prefix (both work)
PG_HOST=your_host
PG_USER=your_user
PG_PASSWORD=your_password
PG_DATABASE=your_database
PG_PORT=5432

# JWT Secret (MUST be same for all modules)
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=30d
```

## ✅ Benefits

1. **Single Source of Truth**: One login endpoint, one database, one JWT secret
2. **Simplified Frontend**: Frontend only needs to call one login endpoint
3. **Consistent Authentication**: All modules validate tokens the same way
4. **Easier Maintenance**: Changes to auth logic only need to be made in one place
5. **Better Security**: Centralized authentication management

## 🚀 Migration Notes

If you have existing frontend code:

**Before:**
```javascript
// Different endpoints for different modules
await fetch('/api/batchcode/auth/login', {...});
await fetch('/api/o2d/auth/login', {...});
await fetch('/api/lead-to-order/auth/login', {...});
```

**After:**
```javascript
// Single endpoint for all modules
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
const { data: { token } } = await response.json();

// Use same token for all module requests
fetch('/api/batchcode/...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
fetch('/api/o2d/...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
fetch('/api/lead-to-order/...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## ⚠️ Important Notes

1. **JWT_SECRET**: Must be the same across all modules. If changed, all existing tokens will be invalid.
2. **Database**: All modules should use the same database credentials from `.env`
3. **Token Format**: All modules expect `Authorization: Bearer <token>` header format
4. **Backward Compatibility**: Old login endpoints are removed. Frontend must be updated to use `/api/auth/login`

---

**Implementation Date**: $(date)
**Status**: ✅ Complete - Single login is now active for all modules


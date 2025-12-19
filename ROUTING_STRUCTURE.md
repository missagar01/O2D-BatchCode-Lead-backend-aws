# Backend Routing Structure

## Route Mounting Hierarchy

```
Express App (app)
│
├─ /api (apiRouter)
│   │
│   ├─ /o2d (o2dRoutes from src/o2d/routes/index.js)
│   │   │
│   │   ├─ /first-weight (firstWeightRoutes)
│   │   │   ├─ GET /pending
│   │   │   └─ GET /history
│   │   │
│   │   ├─ /second-weight (secondWeightRoutes)
│   │   │   ├─ GET /pending
│   │   │   └─ GET /history
│   │   │
│   │   ├─ /invoice (invoiceRoutes)
│   │   │   ├─ GET /pending
│   │   │   └─ GET /history
│   │   │
│   │   ├─ /gate-out (gateOutRoutes)
│   │   │   ├─ GET /pending
│   │   │   ├─ GET /history
│   │   │   └─ GET /customers
│   │   │
│   │   ├─ /payment (paymentRoutes)
│   │   │   ├─ GET /pending
│   │   │   ├─ GET /history
│   │   │   └─ GET /customers
│   │   │
│   │   ├─ /dashboard (dashboardRoutes)
│   │   │   └─ GET /summary ✅
│   │   │
│   │   ├─ /auth (authRoutes)
│   │   │   └─ POST /logout
│   │   │
│   │   └─ /complaint (complaintRoutes)
│   │       ├─ GET /
│   │       ├─ POST /
│   │       ├─ PUT /:id
│   │       └─ DELETE /:id
│   │
│   ├─ /lead-to-order (leadToOrderRoutes)
│   ├─ /batchcode (batchcodeApp)
│   └─ /auth (sharedAuthRoutes)
│       └─ POST /login
│
├─ / (rootRoutes)
│   ├─ GET /users
│   ├─ GET /schema
│   ├─ GET /current-schema
│   ├─ POST /store-indent
│   ├─ PUT /store-indent/approve
│   ├─ GET /store-indent/pending
│   ├─ GET /store-indent/history
│   └─ GET /tables
│
└─ GET /health
```

## File Locations

### Main App
- **Entry Point**: `backend/server.cjs`
- **Express App**: `backend/src/app.js`
- **Port**: `process.env.PORT` or `3006` (default)

### O2D Routes
- **Main Router**: `backend/src/o2d/routes/index.js`
- **Dashboard Routes**: `backend/src/o2d/routes/dashboard.routes.js`
- **Dashboard Controller**: `backend/src/o2d/controllers/dashboard.controller.js`
- **Dashboard Service**: `backend/src/o2d/services/dashboard.service.js`

### Route Mounting Points

1. **`backend/src/app.js`** (line 102):
   ```javascript
   app.use("/api", apiRouter);
   ```

2. **`backend/src/app.js`** (line 58):
   ```javascript
   apiRouter.use("/o2d", o2dRoutes);
   ```

3. **`backend/src/o2d/routes/index.js`** (line 19):
   ```javascript
   router.use("/dashboard", dashboardRoutes);
   ```

4. **`backend/src/o2d/routes/dashboard.routes.js`** (line 7):
   ```javascript
   router.get("/summary", asyncHandler(fetchDashboardSummary));
   ```

## Full URL Paths

### O2D Endpoints
- Dashboard: `GET /api/o2d/dashboard/summary`
- First Weight Pending: `GET /api/o2d/first-weight/pending`
- First Weight History: `GET /api/o2d/first-weight/history`
- Second Weight Pending: `GET /api/o2d/second-weight/pending`
- Second Weight History: `GET /api/o2d/second-weight/history`
- Invoice Pending: `GET /api/o2d/invoice/pending`
- Invoice History: `GET /api/o2d/invoice/history`
- Gate Out Pending: `GET /api/o2d/gate-out/pending`
- Gate Out History: `GET /api/o2d/gate-out/history`
- Payment Pending: `GET /api/o2d/payment/pending`
- Payment History: `GET /api/o2d/payment/history`

### Authentication
- Login: `POST /api/auth/login` (shared auth)
- O2D Logout: `POST /api/o2d/auth/logout`

### Root Routes (Oracle)
- Health: `GET /health`
- Users: `GET /users`
- Schema: `GET /schema`
- Store Indent: `POST /store-indent`

## Verification Commands

To check if routes are properly mounted:

```bash
# Check route references
grep -RIn "dashboard/summary" backend/

# Check o2d router mounting
grep -RIn "o2dRoutes\|/o2d" backend/src/app.js

# Check dashboard routes
grep -RIn "dashboard" backend/src/o2d/routes/

# Check all route files
find backend/src/o2d/routes -name "*.js" -type f
```

## Route Flow Example

Request: `GET /api/o2d/dashboard/summary`

1. Request hits Express app
2. Matches `/api` → goes to `apiRouter`
3. Matches `/o2d` → goes to `o2dRoutes` (from `src/o2d/routes/index.js`)
4. Matches `/dashboard` → goes to `dashboardRoutes` (from `src/o2d/routes/dashboard.routes.js`)
5. Matches `/summary` → calls `fetchDashboardSummary` controller
6. Controller calls `getDashboardData` service
7. Service uses `getConnection()` from `src/o2d/config/db.js`
8. Executes Oracle query
9. Returns response with CORS headers

## Troubleshooting

If routes are not working:

1. **Check if route is mounted**: Verify all mounting points exist
2. **Check async handlers**: All routes should use `asyncHandler`
3. **Check CORS**: Ensure CORS middleware is applied first
4. **Check Oracle connection**: Verify `ORACLE_CONNECTION_STRING` is set
5. **Check error handling**: Errors should be caught and return proper responses


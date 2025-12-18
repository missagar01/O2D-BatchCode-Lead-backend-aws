# Lead Backend API

## Server Overview
- **Base URL**: `http://localhost:3006` (default port, configurable via `PORT` environment variable)
- **Entry Point**: `server.cjs` (uses `src/app.js` as the main Express app)
- **API Router**: Mounted at `/api`; root routes are available at `/` (see "Root routes" section)
- **Note**: The root `index.js` file is deprecated and not used. All routes are integrated through `src/app.js`
- Response shapes:
  - Most modules respond with `{"success": true, "data": ...}` or, in the batchcode module, `{"success": true, "message": "...", "data": ..., "meta": ...}`.
  - Errors include `success: false` and an `error`/`message` string.
- Oracle-powered endpoints (the o2d module and the root helpers) accept optional filters: `page` (default `1`), `limit` (default `50`), `customer`, and `search`.
- JWT protection:
  - All protected endpoints require a `Bearer <token>` issued by the single login endpoint `/api/auth/login`.
  - All modules (batchcode, o2d, lead-to-order) use the same JWT_SECRET and validate tokens from the shared login.

## Root routes (non-`/api`)

- `GET /health`  
  Reply: `{"status": "ok", "timestamp": "<iso>"}` — quick uptime probe.

- `GET /users`  
  Checks `SRMPLERP` schema/table, then returns every row from `SRMPLERP.ACCBAL_AUDIT`. Response: `[{ ... }]`.

- `GET /schema`  
  Returns `{"totalSchemas": n, "schemas": {SCHEMA: [TABLE, ...], ...}}`.

- `GET /current-schema`  
  Returns the schema name via `SELECT sys_context(...)`.

- `POST /store-indent`  
  Creates a new row in `STORE_INDENT`. Required body fields (all strings unless noted): `timestamp`, `indenterName`, `department`, `groupHead`, `itemCode`, `productName`, `quantity`, `uom`, `specifications`, `indentApprovedBy`, `indentType`, `attachment`. `indentNumber` is auto-generated. Response example:
  ```json
  {
    "success": true,
    "message": "Indent saved successfully",
    "indentNumber": "SI-0001"
  }
  ```

- `PUT /store-indent/approve`  
  Body: `{ "indentNumber", "itemCode", "vendorType", "approvedQuantity" }`. Sets `VENDOR_TYPE`/`APPROVED_QUANTITY`.

- `GET /store-indent/pending`  
  Returns rows where `PLANNED_1` exists but `ACTUAL_1` is `NULL`.

- `GET /store-indent/history`  
  Returns rows with both `PLANNED_1` and `ACTUAL_1`.

- `GET /tables`  
  Lists every `TABLE_NAME` in owner `SRMPLERP`.

## `/api/auth` (Single Login for All Modules)

- `POST /api/auth/login`  
  **Single login endpoint for all modules** (batchcode, o2d, lead-to-order).  
  Body: `{ "username" | "user_name", "password" }`. Returns `{ success, data: { user, token } }`. The user object matches the Postgres `users` table (id, email, department, role, etc.).  
  **All modules use this same token** - no separate login endpoints needed.

## `/api/o2d` module
Base path: `/api/o2d`. Uses Oracle via SSH tunnel; responses are plain JSON objects with `success`/`data`.

### Authentication

- `POST /api/o2d/auth/logout`  
  Stateless; returns `{ success: true, message: "Logged out..." }`.

**Note**: 
- Login removed - use `/api/auth/login` instead. All modules share the same login endpoint.
- All user CRUD operations removed - use shared authentication system.

### First / Second weight dashboards

- `GET /api/o2d/first-weight/pending`  
- `GET /api/o2d/first-weight/history`  
- `GET /api/o2d/second-weight/pending`  
- `GET /api/o2d/second-weight/history`  
  Optional query params: `page`, `limit`, `customer`, `search`. Each returns `{"success": true, "data": [ { order_vrno, vrno, party_name, truckno, driver_name, ... } ]}`.

### Invoice

- `GET /api/o2d/invoice/pending`, `GET /api/o2d/invoice/history`  
  Same filters (`page`, `customer`, `search`). The history endpoint also exposes invoice numbers, waybill, and `party_name`.

### Gate out

- `GET /api/o2d/gate-out/pending`  
- `GET /api/o2d/gate-out/history`  
  Query parameters: `page`, `limit`, `customer`, `search`.

- `GET /api/o2d/gate-out/customers`  
  Returns an array of unique customer names.

### Payment

- `GET /api/o2d/payment/pending`, `GET /api/o2d/payment/history`  
  Filters: `page`, `limit`, `customer`, `search`. Responses include calculated `received_amount`, `balance_amount`, and `days`.

- `GET /api/o2d/payment/customers`  
  Returns unique customer names.

### Dashboard summary

- `GET /api/o2d/dashboard/summary`  
  Optional query params: `partyName`/`party`, `itemName`/`item`, `salesPerson`/`sales`, `stateName`/`state`, `fromDate`, `toDate`. Response:
  ```json
  {
    "success": true,
    "data": {
      "summary": { "totalGateIn": ..., ... },
      "filters": { "parties": [...], "items": [...], ... },
      "rows": [ { "indate": ..., "partyName": ..., ... } ],
      "appliedFilters": { ... },
      "lastUpdated": "<iso>"
    }
  }
  ```

## `/api/lead-to-order`
Paths are prefixed with `/api/lead-to-order` and guarded by the JWT issued by `POST /api/auth/login`.

### Authentication

**Note**: Login removed - use `/api/auth/login` instead. All modules share the same login endpoint.

- `GET /api/lead-to-order/auth/data` *(requires token)*  
  Returns a combined list of the user’s FMS leads/enquiries.

- `POST /api/lead-to-order/auth/create-user` *(admin only)*  
  Body: `{ username, password, usertype }`.

- `POST /api/lead-to-order/auth/verify-token` *(requires token)*  
  Returns `{ success: true, user: req.user }`.

### Dashboard

- `GET /api/lead-to-order/dashboard/metrics?userId=<username>&isAdmin=<true|false>`  
  Returns counts (total leads, pending followups, orders, etc.).

- `GET /api/lead-to-order/dashboard/charts?userId=<username>&isAdmin=<true|false>`  
  Returns the prepared overview/conversion/source charts (fallbacks if queries fail).

### Leads + dropdowns

- `POST /api/lead-to-order/leads`  
  Body: `{ receiverName, scName, source, companyName, phoneNumber?, salespersonName?, location?, email?, state?, address?, nob?, notes? }`. Returns `{ success: true, data: { id, leadNo, createdAt } }`.

- `GET /api/lead-to-order/lead-dropdown`  
  Returns dropdown data (`receiverNames`, `scNames`, `leadSources`, `states`, `nob`, `companyList`).

- `GET /api/lead-to-order/products`  
  Returns `{ products: [{ item_code, item_name }] }`.

### Direct enquiry → order

- `POST /api/lead-to-order/enquiry-to-order`  
  Body highlights: `scName`, `leadSource`, `companyName`, `phoneNumber`, `salesPersonName`, `location`, `emailAddress`, `enquiryReceiverName`, `enquiryDate`, `enquiryApproach`, `items` (JSON array). Response: saved row (including trigger-generated `en_enquiry_no`).

- `GET /api/lead-to-order/enquiry-to-order/dropdowns`  
  Returns lead sources, enquiry approaches, SC names, items, direct companies, receiver names, and sales person names.

### Enquiry tracker

- `GET /api/lead-to-order/enquiry-tracker/pending`  
- `GET /api/lead-to-order/enquiry-tracker/history`  
- `GET /api/lead-to-order/enquiry-tracker/direct-pending`  
- `GET /api/lead-to-order/enquiry-tracker/view/:type/:id`  
  All require `Authorization` header (the same JWT). History/pending respond with rows from `enquiry_tracker`, `fms_leads`, or `enquiry_to_order`.

- `POST /api/lead-to-order/enquiry-tracker/form`  
  Body fields: `enquiry_no`, `enquiry_status`, `what_did_customer_say`, `current_stage`, `followup_status`, `next_call_date`, `next_call_time`, `is_order_received_status`, `acceptance_via`, `payment_mode`, `payment_terms_in_days`, `transport_mode`, `remark`, `if_no_relevant_reason_status`, `if_no_relevant_reason_remark`, `customer_order_hold_reason_category`, `holding_date`, `hold_remark`, `sales_cordinator`, `calling_days`, `party_name`, `sales_person_name`. Updates `enquiry_tracker`, `fms_leads`, and `enquiry_to_order`. Response includes inserted tracker row plus updated lead row.

- `GET /api/lead-to-order/enquiry-tracker/dropdowns/:column`  
  Allowed columns: `lead_receiver_name`, `lead_source`, `state`, `quotation_shared_by`, `enquiry_status`, `acceptance_via`, `payment_mode`, `payment_terms_days`, `not_received_reason_status`, `hold_reason_category`, `followup_status`, `what_did_customer_say`, `transport_mode`. Response: `{ success: true, values: [...] }`.

### Followups

- `GET /api/lead-to-order/followup/pending`, `GET /api/lead-to-order/followup/history` *(JWT protected)*  
  Return pending followups from `fms_leads` and history from `leads_tracker`.

- `POST /api/lead-to-order/followup/followup`  
  Body: `{ leadNo, customer_say?, lead_status?, enquiry_received_status?, enquiry_received_date?, enquiry_approach?, project_value?, item_qty?, total_qty?, next_action?, next_call_date?, next_call_time? }`. Inserts into `leads_tracker` and updates `fms_leads`.

- `GET /api/lead-to-order/followup/dropdowns`  
  Returns `{ customerSay, enquiryApproach, productCategories }`.

### Quotations

- `POST /api/lead-to-order/quotations/quotation`  
  Requires a large body covering quotation meta (number, date, preparedBy), consignor/consignee info, payment/terms, bank details, `items` (JSON array), `pdfUrl`, and financial totals. Response is the inserted quotation.

- `GET /api/lead-to-order/quotations/quotation/:quotationNo`  
  Fetches a quotation by number.

- `GET /api/lead-to-order/quotations/get-next-number`  
  Returns `{ success: true, nextNumber: "QN-XXX" }`.

- `GET /api/lead-to-order/quotations/dropdowns`  
  Returns a large set of dropdowns (`lead_receiver_name`, `lead_source`, `sp_state`, `payment_terms`, `item_name`, etc.).

- `POST /api/lead-to-order/quotations/upload-pdf`  
  Multipart/form-data with field `pdf`. The middleware uploads the file to S3 and replies `{ success: true, url: "https://..." }`.

### Quotation leads

- `GET /api/lead-to-order/quotation-leads/lead-numbers`  
  Returns deduplicated lead numbers from both `fms_leads` and `enquiry_to_order`.

- `GET /api/lead-to-order/quotation-leads/lead-details/:leadNo`  
  Returns the row and the sheet source (`FMS` or `ENQUIRY`).

- `GET /api/lead-to-order/quotation-leads/quotation-numbers`  
  Lists surnamed `quotation_no` values from `make_quotation`.

- `GET /api/lead-to-order/quotation-leads/quotation-details/:quotationNo`  
  Returns mapped quotation data (items array, consignor/consignee info, financials, etc.).

## `/api/batchcode`
Base path: `/api/batchcode`. Every route requires `Authorization: Bearer <token>` from `/api/auth/login`.

### Authentication

**Note**: Login removed - use `/api/auth/login` instead. All modules share the same login endpoint.

- Protected admin endpoints (`/auth/register`, `/auth/register/:id`, `/auth/logout`, etc.) allow CRUD on registrants. `requireRoles` guards `/auth/register*` to `admin`/`superadmin`.

### Admin overview

- `GET /api/batchcode/admin/overview[/:unique_code]`  
  Optional `unique_code` path or query param filters every table snapshot. Returns `{ data: { tables: { qc_lab_samples: [...], ... }, counts: {...}, filters: {...} } }`.

### QC lab samples

- `POST /api/batchcode/qc-lab-samples`  
  `multipart/form-data` with `report_picture` file plus the standard qc payload (checked in `qcLabSamples.validation`). Returns `{ success, message, data: { unique_code, ... } }`.

- `GET /api/batchcode/qc-lab-samples`  
  Optional query params: `id`, `unique_code`.

- `GET /api/batchcode/qc-lab-samples/:unique_code`  
  Return the entry for the code.

### SMS register

- `POST /api/batchcode/sms-register`  
  Requires `picture` upload. The controller derives `unique_code` from the date/sequence.

- `GET /api/batchcode/sms-register`  
  Filterable by `id` or `unique_code`.

### Hot coil

- `POST /api/batchcode/hot-coil`  
  Fields must include `sms_short_code` or `unique_code`; fails if missing. Accepts an optional `picture`.

- `GET /api/batchcode/hot-coil`, `GET /api/batchcode/hot-coil/:unique_code`  
  Standard list/get.

### Pipe mill

- `POST /api/batchcode/pipe-mill`  
  Accepts a `picture` upload and returns a generated `unique_code` (`P-XXXX`).

- `GET /api/batchcode/pipe-mill`, `GET /api/batchcode/pipe-mill/:unique_code`.

### Re-coiler

- `POST /api/batchcode/re-coiler`  
  Body must include `hot_coiler_short_code` and `machine_number` (one or more of `SRMPL01`-`SRMPL09`). Each machine produces its own `unique_code` (e.g., `2401A`).

- `GET /api/batchcode/re-coiler`, `GET /api/batchcode/re-coiler/:unique_code`.

### Laddle checklist

- `POST /api/batchcode/laddle-checklist`  
  Unique code `C-XXXX` is generated automatically.

- `GET /api/batchcode/laddle-checklist`, `GET /api/batchcode/laddle-checklist/:unique_code`.

### Laddle return

- `POST /api/batchcode/laddle-return`  
  Multipart upload with fields `poring_temperature_photo`, `ccm_temp_before_pursing_photo`, `ccm_temp_after_pursing_photo`.

- `GET /api/batchcode/laddle-return`, `GET /api/batchcode/laddle-return/:unique_code`.

### Tundish checklist

- `POST /api/batchcode/tundish-checklist`  
  Generates `unique_code` `T-XXXX`.

- `GET /api/batchcode/tundish-checklist`, `GET /api/batchcode/tundish-checklist/:unique_code`.

### Notes
- Multipart uploads rely on `src/batchcode/middlewares/fileUpload`. Include the correct `Content-Type: multipart/form-data` and use the field names shown above.
- Every batchcode creation route enforces `requireAuth` and returns the generated `unique_code` (and sometimes a `_warning` if the SMS short code is not registered).

---

## Project Structure

```
lead backend/
├── config/                    # Database and environment configuration
│   ├── database.js           # Main database connections
│   ├── db.js                 # Database utilities
│   ├── pg.js                 # PostgreSQL connection pool
│   ├── oracleClient.js       # Oracle client initialization
│   └── sshTunnel.js          # SSH tunnel for remote database access
├── src/
│   ├── app.js                # Main Express application (ES6 module)
│   ├── auth/                 # Shared authentication module
│   │   ├── controllers/
│   │   │   └── login.controller.js
│   │   └── routes/
│   │       └── login.routes.js
│   ├── routes/               # Root-level routes (non-/api)
│   │   └── root.routes.js    # Oracle helper routes (/users, /schema, /store-indent, etc.)
│   ├── batchcode/            # Batchcode module (CommonJS)
│   │   ├── app.cjs           # Batchcode Express app
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # Route definitions
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   ├── middlewares/      # Auth, validation, error handling
│   │   ├── validations/      # Request validation schemas
│   │   └── utils/            # Utilities (logger, API responses, etc.)
│   ├── lead-to-order/        # Lead to Order module (CommonJS)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/       # Auth and S3 upload
│   │   └── models/
│   └── o2d/                  # O2D module (CommonJS)
│       ├── app.js
│       ├── config/
│       │   └── db.js         # Oracle connection pool (used by root routes)
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── middleware/
├── server.cjs                # Server entry point (CommonJS)
├── index.js                  # ⚠️ DEPRECATED - Not used, kept for reference
├── package.json
└── README.md                 # This file
```

### Module Architecture

1. **Shared Auth** (`/api/auth/login`): Common login endpoint for all modules using PostgreSQL `users` table
2. **Batchcode Module** (`/api/batchcode/*`): Manufacturing batch tracking with JWT authentication
3. **Lead-to-Order Module** (`/api/lead-to-order/*`): CRM functionality with JWT authentication
4. **O2D Module** (`/api/o2d/*`): Order-to-delivery tracking using Oracle database
5. **Root Routes** (`/`): Oracle helper endpoints for schema/table management and store indents

### Database Connections

- **PostgreSQL**: Used by shared auth, batchcode, and lead-to-order modules
- **Oracle**: Used by o2d module and root routes (via SSH tunnel if configured)
- **Connection Pooling**: Each module manages its own database connections

### Authentication Flow

1. **Single Login**: `POST /api/auth/login` - Returns JWT token for all modules
2. **Token Validation**: All modules (batchcode, o2d, lead-to-order) validate tokens using the same `JWT_SECRET` from environment variables
3. **Shared Database**: All modules use the same PostgreSQL database credentials from `.env` file (lines 33-39: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, etc.)

Each module's middleware validates tokens from the shared login endpoint.

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file with required database connections, JWT secrets, etc.

3. **Start Server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Health Check**:
   ```bash
   curl http://localhost:3006/health
   ```

---

## API Endpoints Summary

### Authentication Endpoints
- `POST /api/auth/login` - **Single login for all modules** (batchcode, o2d, lead-to-order)

### Root Endpoints (No `/api` prefix)
- `GET /health` - Server health check
- `GET /users` - Oracle users query
- `GET /schema` - List all schemas
- `GET /current-schema` - Current schema name
- `POST /store-indent` - Create store indent
- `PUT /store-indent/approve` - Approve indent
- `GET /store-indent/pending` - Pending indents
- `GET /store-indent/history` - Indent history
- `GET /tables` - List tables in SRMPLERP schema


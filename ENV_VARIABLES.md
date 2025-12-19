# Environment Variables Configuration Guide

This document lists all required and optional environment variables for the O2D Backend.

## Required Variables for Oracle Connection (index.js)

The root `index.js` file requires these three variables:

```bash
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=hostname:port/service_name
```

### ORACLE_CONNECTION_STRING Format

The connection string can be in one of these formats:

1. **Service Name Format** (recommended):
   ```
   ORACLE_CONNECTION_STRING=oracle.example.com:1521/XEPDB1
   ```

2. **SID Format**:
   ```
   ORACLE_CONNECTION_STRING=oracle.example.com:1521:ORCL
   ```

3. **Localhost (if using SSH tunnel)**:
   ```
   ORACLE_CONNECTION_STRING=127.0.0.1:1521/ora11g
   ```

## Complete .env File Template

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGINS=*

# ============================================
# Oracle Database Configuration (REQUIRED)
# ============================================
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=hostname:port/service_name

# Optional: Oracle Client Library Path
# ORACLE_CLIENT=/opt/oracle/instantclient_23_9

# ============================================
# SSH Tunnel Configuration (Optional)
# ============================================
# Only needed if Oracle is behind an SSH tunnel
# SSH_HOST=your-ssh-server.com
# SSH_USER=ubuntu
# SSH_PASSWORD=your_ssh_password
# SSH_PORT=22
# ORACLE_HOST=127.0.0.1
# ORACLE_PORT=1521
# LOCAL_ORACLE_PORT=1521

# ============================================
# PostgreSQL Database Configuration
# ============================================
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
DB_SSL=false

# ============================================
# JWT Authentication (REQUIRED)
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
```

## Troubleshooting

### Error: "connectString cannot be empty or undefined"

This error means `ORACLE_CONNECTION_STRING` is missing or empty in your `.env` file.

**Solution:**
1. Check that your `.env` file exists in the `backend/` directory
2. Verify that `ORACLE_CONNECTION_STRING` is set and not empty
3. Ensure there are no extra spaces or quotes around the value
4. Restart your PM2 process after updating `.env`:
   ```bash
   pm2 restart o2d-backend
   ```

### Checking Your .env File on AWS

1. SSH into your AWS server
2. Navigate to your project directory
3. Check if `.env` exists:
   ```bash
   ls -la .env
   ```
4. View the file (be careful with sensitive data):
   ```bash
   cat .env | grep ORACLE
   ```
5. Edit the file:
   ```bash
   nano .env
   ```

### Example .env for AWS Deployment

```bash
NODE_ENV=production
PORT=3000

# Oracle Database (REQUIRED)
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password
ORACLE_CONNECTION_STRING=your-oracle-rds-endpoint.region.rds.amazonaws.com:1521/ORCL

# PostgreSQL
DB_HOST=your-postgres-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres_user
DB_PASSWORD=postgres_password
DB_NAME=your_database
DB_SSL=true

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
```

## Environment Variable Reference

### Oracle Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ORACLE_USER` | ✅ Yes | Oracle database username | `SRMPLERP` |
| `ORACLE_PASSWORD` | ✅ Yes | Oracle database password | `password123` |
| `ORACLE_CONNECTION_STRING` | ✅ Yes | Connection string | `host:1521/XEPDB1` |
| `ORACLE_CLIENT` | ❌ No | Path to Oracle Instant Client | `/opt/oracle/instantclient_23_9` |
| `ORACLE_HOST` | ❌ No | Oracle host (for SSH tunnel) | `127.0.0.1` |
| `ORACLE_PORT` | ❌ No | Oracle port (for SSH tunnel) | `1521` |
| `LOCAL_ORACLE_PORT` | ❌ No | Local port for SSH tunnel | `1521` |

### SSH Tunnel Variables (Optional)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SSH_HOST` | ❌ No | SSH server hostname | `bastion.example.com` |
| `SSH_USER` | ❌ No | SSH username | `ubuntu` |
| `SSH_PASSWORD` | ❌ No | SSH password | `password` |
| `SSH_PORT` | ❌ No | SSH port | `22` |
| `SSH_KEY_PATH` | ❌ No | Path to SSH private key | `/home/user/.ssh/id_rsa` |
| `SSH_PRIVATE_KEY` | ❌ No | SSH private key content | `-----BEGIN RSA...` |

### PostgreSQL Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_HOST` | ✅ Yes* | PostgreSQL host | `localhost` |
| `DB_USER` | ✅ Yes* | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | ✅ Yes* | PostgreSQL password | `password` |
| `DB_NAME` | ✅ Yes* | Database name | `mydb` |
| `DB_PORT` | ❌ No | PostgreSQL port | `5432` |
| `DB_SSL` | ❌ No | Enable SSL | `false` |

*Required if using batchcode or lead-to-order modules

### JWT Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `JWT_SECRET` | ✅ Yes | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | ❌ No | Token expiration | `1d` |

## Quick Setup Checklist

- [ ] Create `.env` file in `backend/` directory
- [ ] Set `ORACLE_USER`
- [ ] Set `ORACLE_PASSWORD`
- [ ] Set `ORACLE_CONNECTION_STRING` (format: `host:port/service`)
- [ ] Set `JWT_SECRET`
- [ ] Set PostgreSQL variables (if using batchcode/lead-to-order)
- [ ] Restart PM2: `pm2 restart o2d-backend`
- [ ] Check logs: `pm2 logs o2d-backend`


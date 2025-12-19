# Oracle Instant Client Installation Guide

## Problem
You're getting this error:
```
NJS-138: connections to this database server version are not supported by node-oracledb in Thin mode
```

This means your Oracle database is **Oracle 11g or older**, which requires **Thick mode** with Oracle Instant Client.

## Solution: Install Oracle Instant Client

### Step 1: Download Oracle Instant Client

1. Go to Oracle Instant Client downloads:
   https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html

2. You need to download **Basic Package** and **SDK Package**:
   - `instantclient-basic-linux.x64-21.13.0.0.0dbru.zip` (or latest version)
   - `instantclient-sdk-linux.x64-21.13.0.0.0dbru.zip` (or latest version)

3. **Note**: You need an Oracle account (free) to download. If you don't have one, create it at oracle.com

### Step 2: Upload to AWS Server

Upload the zip files to your AWS server:

```bash
# From your local machine, use SCP:
scp instantclient-basic-linux.x64-*.zip ubuntu@your-aws-server:/tmp/
scp instantclient-sdk-linux.x64-*.zip ubuntu@your-aws-server:/tmp/
```

Or download directly on the server (if you have Oracle account credentials):

```bash
# SSH into your server first
ssh ubuntu@your-aws-server

# Then download (you'll need Oracle account)
cd /tmp
wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip
wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-sdk-linux.x64-21.13.0.0.0dbru.zip
```

### Step 3: Install on AWS Server

```bash
# SSH into your AWS server
ssh ubuntu@your-aws-server

# Install required dependencies
sudo apt-get update
sudo apt-get install -y libaio1 unzip

# Create directory
sudo mkdir -p /opt/oracle
cd /opt/oracle

# Extract the zip files (adjust version number if different)
sudo unzip /tmp/instantclient-basic-linux.x64-*.zip
sudo unzip /tmp/instantclient-sdk-linux.x64-*.zip

# This creates: /opt/oracle/instantclient_21_13/ (or similar version number)
# Check what directory was created:
ls -la /opt/oracle/

# Set up library path
echo "/opt/oracle/instantclient_21_13" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Verify installation
ls -la /opt/oracle/instantclient_21_13/ | grep libclntsh
# You should see: libclntsh.so -> libclntsh.so.21.1 (or similar)
```

### Step 4: Update .env File

Edit your `.env` file:

```bash
cd ~/actions-runner/_work/O2D-BatchCode-Lead-backend-aws/O2D-BatchCode-Lead-backend-aws
nano .env
```

Add or update:
```bash
ORACLE_CLIENT=/opt/oracle/instantclient_21_13
```

**Important**: Replace `21_13` with the actual version number you installed. Check with:
```bash
ls /opt/oracle/
```

### Step 5: Restart PM2

```bash
pm2 restart o2d-lead-batch --update-env
pm2 logs o2d-lead-batch --lines 50
```

### Step 6: Verify Thick Mode

In the logs, you should see:
```
✅ Oracle Thick Client initialized at: /opt/oracle/instantclient_21_13
✅ Running in Thick mode (Oracle Instant Client detected)
✅ Oracle connection pool started
✅ Database connection test successful
```

Instead of:
```
⚠️ Instant Client not found, staying in Thin mode
```

## Alternative: Use Oracle 12c+ Compatible Version

If you can't install Instant Client, you could:
1. Upgrade your Oracle database to 12.1.0.2 or later (supports Thin mode)
2. Or use a different connection method

## Quick Installation Script

Save this as `install-oracle-client.sh`:

```bash
#!/bin/bash
set -e

echo "📦 Installing Oracle Instant Client..."

# Install dependencies
sudo apt-get update
sudo apt-get install -y libaio1 unzip wget

# Create directory
sudo mkdir -p /opt/oracle
cd /opt/oracle

# Download (you need to provide Oracle account credentials)
echo "⚠️ You need to download Oracle Instant Client manually:"
echo "   1. Go to: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html"
echo "   2. Download Basic and SDK packages"
echo "   3. Upload to /tmp/ on this server"
echo "   4. Then run: sudo unzip /tmp/instantclient-basic-linux.x64-*.zip"
echo "   5. Then run: sudo unzip /tmp/instantclient-sdk-linux.x64-*.zip"

# After extraction, set up library path
INSTANT_CLIENT_DIR=$(ls -d /opt/oracle/instantclient_* | head -1)
if [ -n "$INSTANT_CLIENT_DIR" ]; then
    echo "$INSTANT_CLIENT_DIR" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
    sudo ldconfig
    echo "✅ Oracle Instant Client installed at: $INSTANT_CLIENT_DIR"
    echo "✅ Add to .env: ORACLE_CLIENT=$INSTANT_CLIENT_DIR"
else
    echo "❌ Oracle Instant Client not found. Please extract the zip files first."
fi
```

## Troubleshooting

### Error: "libaio1 has no installation candidate"
On Ubuntu 24.04, use:
```bash
sudo apt-get install -y libaio1t64
```

### Error: "Cannot find libclntsh.so"
Make sure you extracted BOTH Basic and SDK packages, and ran `sudo ldconfig`.

### Error: Still getting NJS-138
1. Check that `ORACLE_CLIENT` is set correctly in `.env`
2. Restart PM2: `pm2 restart o2d-lead-batch --update-env`
3. Check logs to see if Thick mode is active
4. Verify the directory exists: `ls -la /opt/oracle/instantclient_21_13/`

### Check Current Mode
```bash
node -e "const oracledb=require('oracledb'); console.log('Thin mode:', oracledb.thin);"
```
- `true` = Thin mode (needs Instant Client for old Oracle)
- `false` = Thick mode (should work with Oracle 11g)

## Supported Oracle Versions

### Thin Mode (no Instant Client needed)
- Oracle 12.1.0.2 and later ✅
- Oracle 11g and older ❌ (not supported)

### Thick Mode (requires Instant Client)
- All Oracle versions ✅ (11g, 12c, 18c, 19c, 21c, 23c)

## Your Current Setup

Based on your logs:
- Oracle Database: **Oracle 11g** (ora11g)
- Current Mode: **Thin mode** (not supported for 11g)
- Required: **Thick mode** (needs Instant Client)

Install Oracle Instant Client to fix this issue.


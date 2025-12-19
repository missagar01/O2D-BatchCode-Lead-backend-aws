# Quick Fix for NJS-138 Error

## Problem
You're seeing this error:
```
NJS-138: connections to this database server version are not supported by node-oracledb in Thin mode
```

This happens because:
- Your Oracle database is **Oracle 11g** (ora11g)
- **Thin mode** (default) only supports Oracle 12.1.0.2 and later
- You need **Thick mode** with Oracle Instant Client

## Solution: Install Oracle Instant Client

### Step 1: Download Oracle Instant Client

1. Go to: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html
2. You'll need a **free Oracle account** (create one if needed)
3. Download these two files:
   - **instantclient-basic-linux.x64-21.13.0.0.0dbru.zip** (Basic Package)
   - **instantclient-sdk-linux.x64-21.13.0.0.0dbru.zip** (SDK Package)

   > **Note**: You can use any version 12.2 or later. Version 21.13 is recommended.

### Step 2: Upload to AWS Server

From your local machine, upload the files to AWS:

```bash
scp instantclient-basic-linux.x64-*.zip ubuntu@your-aws-ip:/tmp/
scp instantclient-sdk-linux.x64-*.zip ubuntu@your-aws-ip:/tmp/
```

Replace `your-aws-ip` with your actual AWS server IP address.

### Step 3: Install on AWS Server

SSH into your AWS server and run:

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y libaio1t64 unzip

# Create directory
sudo mkdir -p /opt/oracle
cd /opt/oracle

# Extract the zip files
sudo unzip /tmp/instantclient-basic-linux.x64-*.zip
sudo unzip /tmp/instantclient-sdk-linux.x64-*.zip

# Find the extracted directory name
ls -la /opt/oracle/
# You should see something like: instantclient_21_13

# Set up library path (replace 21_13 with your actual version)
echo '/opt/oracle/instantclient_21_13' | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Verify installation
ls -la /opt/oracle/instantclient_21_13/libclntsh.so*
# Should show the library file
```

### Step 4: Update .env File

Edit your `.env` file on AWS:

```bash
nano .env
```

Add this line (replace `21_13` with your actual version):

```bash
ORACLE_CLIENT=/opt/oracle/instantclient_21_13
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 5: Restart PM2

```bash
pm2 restart o2d-lead-batch --update-env
pm2 logs o2d-lead-batch --lines 50
```

### Step 6: Verify Success

Look for these messages in the logs:

✅ **Success indicators:**
```
✅ Oracle Thick Client initialized at: /opt/oracle/instantclient_21_13
✅ Running in Thick mode (Oracle Instant Client detected)
✅ Oracle connection pool started
✅ Database connection test successful
```

❌ **If you still see errors:**
- Check that `ORACLE_CLIENT` path in `.env` matches the actual directory
- Verify the library file exists: `ls -la /opt/oracle/instantclient_*/libclntsh.so*`
- Make sure `ldconfig` ran successfully
- Check PM2 logs for any other errors

## Alternative: Use Installation Script

If you prefer, you can use the automated installation script:

```bash
cd ~/actions-runner/_work/O2D-BatchCode-Lead-backend-aws/O2D-BatchCode-Lead-backend-aws
bash backend/install-oracle-client.sh
```

The script will guide you through the installation process.

## Troubleshooting

### "Package libaio1t64 not found"
On Ubuntu 24.04, the package name is `libaio1t64`. On older versions, try:
```bash
sudo apt-get install -y libaio1
```

### "Cannot find zip files"
Make sure you uploaded the files to `/tmp/` on the AWS server. Check with:
```bash
ls -la /tmp/instantclient-*.zip
```

### "Permission denied"
Make sure you're using `sudo` for commands that require root access.

### "Library not found after installation"
1. Verify the path: `ls -la /opt/oracle/instantclient_*/libclntsh.so*`
2. Check ldconfig: `sudo ldconfig -v | grep oracle`
3. Restart PM2: `pm2 restart o2d-lead-batch --update-env`

## Need More Help?

See the detailed guide: `backend/ORACLE_INSTANT_CLIENT_INSTALL.md`


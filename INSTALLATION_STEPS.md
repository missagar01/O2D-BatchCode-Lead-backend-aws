# Oracle Instant Client Installation Steps

## Step 1: Download and Upload to EC2

On your laptop/PC, download Oracle Instant Client Basic zip from Oracle site, then upload to EC2:

**Windows PowerShell:**
```powershell
scp .\instantclient-basic-linux.x64-*.zip ubuntu@13.235.74.188:/home/ubuntu/
```

**Note:** You may also need the SDK package:
```powershell
scp .\instantclient-sdk-linux.x64-*.zip ubuntu@13.235.74.188:/home/ubuntu/
```

## Step 2: Extract on EC2

SSH into your EC2 server and run:

```bash
sudo mkdir -p /opt/oracle
sudo mv /home/ubuntu/instantclient-basic-linux.x64-*.zip /opt/oracle/
cd /opt/oracle
sudo unzip instantclient-basic-linux.x64-*.zip

# If you uploaded SDK package:
sudo mv /home/ubuntu/instantclient-sdk-linux.x64-*.zip /opt/oracle/
sudo unzip instantclient-sdk-linux.x64-*.zip

# Check what directory was created
ls -lah /opt/oracle
```

**Important:** Note the exact directory name (e.g., `instantclient_21_13`, `instantclient_19_22`, etc.)

## Step 3: Configure Library Path

Replace `instantclient_21_13` with your actual directory name:

```bash
echo "/opt/oracle/instantclient_21_13" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Verify the library is found
ldconfig -p | grep -i clntsh
```

If `libclntsh.so` shows up → Instant Client is OK ✅

## Step 4: Update .env File

Edit your `.env` file:

```bash
nano .env
```

Add this line (replace `instantclient_21_13` with your actual directory name):

```bash
ORACLE_CLIENT=/opt/oracle/instantclient_21_13
```

**Alternative:** You can also use `ORACLE_CLIENT_LIB_DIR` (both are supported):
```bash
ORACLE_CLIENT_LIB_DIR=/opt/oracle/instantclient_21_13
```

**Note:** You do NOT need `NODE_ORACLEDB_DRIVER_MODE=thick` - the code automatically detects Thick mode when Instant Client is found.

## Step 5: Restart PM2

```bash
pm2 restart o2d-lead-batch --update-env
pm2 logs o2d-lead-batch --lines 50
```

## Step 6: Verify Success

Look for these messages in the logs:

✅ **Success:**
```
✅ Oracle Thick Client initialized at: /opt/oracle/instantclient_21_13
✅ Running in Thick mode (Oracle Instant Client detected)
✅ Oracle connection pool started
✅ Database connection test successful
```

❌ **If you still see errors:**
- Check that the path in `.env` matches the actual directory name
- Verify: `ls -lah /opt/oracle/instantclient_*/libclntsh.so*`
- Check: `ldconfig -p | grep -i clntsh`

## Security Reminder

⚠️ **IMPORTANT:** If you've pasted passwords publicly in chat logs, please:
1. Change SSH passwords
2. Change Oracle database passwords
3. Change PostgreSQL passwords
4. Update them on the server

## Need Help?

After running `ls -lah /opt/oracle`, paste the output here and I'll tell you the exact `ORACLE_CLIENT` path to use.


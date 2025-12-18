const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

function initOracleClient() {
  try {
    // Prefer local Windows Instant Client if present, otherwise fallback to bundled path
    const windowsLibDir = path.resolve('C:/oracle/instantclient_23_9');
    const defaultLibDir = path.resolve('/app/oracle_client/instantclient_23_26');

    const libDir = fs.existsSync(windowsLibDir) ? windowsLibDir : defaultLibDir;
    console.log('🔍 Checking Oracle Instant Client at:', libDir);

    if (fs.existsSync(libDir)) {
      const files = fs.readdirSync(libDir);
      console.log('📂 Oracle Client directory contents:', files);

      const hasWinLibs = files.some(f => f.toLowerCase() === 'oci.dll');
      const hasNixLibs = files.some(f => f.includes('libclntsh')) && files.some(f => f.includes('libnnz'));

      if (hasWinLibs || hasNixLibs) {
        // Initialize Thick mode
        oracledb.initOracleClient({ libDir });
        console.log('✅ Oracle Thick Client initialized at:', libDir);
      } else {
        console.warn('⚠️ Oracle libraries not detected in folder, staying in Thin mode.');
      }
    } else {
      console.log('⚠️ Instant Client not found, using Thin mode.');
    }

    // Optional: Display client info
    console.log('🧩 Node-oracledb version:', oracledb.versionString);
  } catch (err) {
    console.error('❌ Failed to initialize Oracle Client:', err);
  }
}

module.exports = { initOracleClient };

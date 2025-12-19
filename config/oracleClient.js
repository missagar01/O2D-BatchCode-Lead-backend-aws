const oracledb = require("oracledb");
const fs = require("fs");
const path = require("path");

function pickFirstExisting(dirs) {
  return dirs.find((d) => d && fs.existsSync(d));
}

function initOracleClient() {
  try {
    // If ORACLE_CLIENT or ORACLE_CLIENT_LIB_DIR is set in .env, use it first
    // ORACLE_CLIENT_LIB_DIR is an alias for compatibility
    const envDir = process.env.ORACLE_CLIENT || process.env.ORACLE_CLIENT_LIB_DIR;

    // Common locations (check multiple versions)
    const linuxDirs = [
      "/opt/oracle/instantclient_21_13",  // Oracle 21c
      "/opt/oracle/instantclient_21_12",
      "/opt/oracle/instantclient_21_11",
      "/opt/oracle/instantclient_19_21",  // Oracle 19c
      "/opt/oracle/instantclient_19_20",
      "/opt/oracle/instantclient_19_19",
      "/opt/oracle/instantclient_18_5",   // Oracle 18c
      "/opt/oracle/instantclient_12_2",   // Oracle 12c (supports 11g)
      "/opt/oracle/instantclient",
      "/opt/oracle/instantclient_23_9",
      "/opt/oracle/instantclient_23_8",
      "/usr/lib/oracle/instantclient",
      "/usr/lib/oracle",
    ];

    const windowsDirs = [
      path.resolve("C:/oracle/instantclient_23_9"),
      path.resolve("C:/oracle/instantclient_23_8"),
    ];

    const candidates =
      process.platform === "win32"
        ? [envDir, ...windowsDirs, ...linuxDirs]
        : [envDir, ...linuxDirs, ...windowsDirs];

    const libDir = pickFirstExisting(candidates);

    console.log("🔍 Oracle Instant Client libDir:", libDir || "(not found)");

    // If no client folder found -> thin mode (works only with node-oracledb thin features)
    if (!libDir) {
      console.log("⚠️ Instant Client not found, staying in Thin mode.");
      console.log("⚠️ WARNING: Thin mode may not support older Oracle versions (11g and below)");
      console.log("⚠️ If you get NJS-138 errors, you need to install Oracle Instant Client for Thick mode");
      console.log("🧩 Node-oracledb:", oracledb.versionString);
      console.log("💡 To install Oracle Instant Client:");
      console.log("   1. Download from: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html");
      console.log("   2. Extract to /opt/oracle/instantclient_21_13 (or similar)");
      console.log("   3. Set ORACLE_CLIENT=/opt/oracle/instantclient_21_13 in .env");
      return;
    }

    // Basic check for libs
    const files = fs.readdirSync(libDir).map((f) => f.toLowerCase());
    const hasWinLibs = files.includes("oci.dll");
    const hasNixLibs = files.some((f) => f.includes("libclntsh")) || files.some((f) => f.includes("libclntsh.so"));

    if (!hasWinLibs && !hasNixLibs) {
      console.warn("⚠️ Oracle libraries not detected in folder. libDir exists but looks wrong:", libDir);
      console.warn("📂 Contents:", fs.readdirSync(libDir));
      return;
    }

    // Init thick mode
    oracledb.initOracleClient({ libDir });
    console.log("✅ Oracle Thick Client initialized at:", libDir);
    console.log("🧩 Node-oracledb:", oracledb.versionString);
  } catch (err) {
    // If already initialized, this is not fatal; otherwise show error
    console.error("❌ Failed to initialize Oracle Client:", err);
    throw err;
  }
}

module.exports = { initOracleClient };

const oracledb = require("oracledb");
const fs = require("fs");
const path = require("path");

function pickFirstExisting(dirs) {
  return dirs.find((d) => d && fs.existsSync(d));
}

function initOracleClient() {
  try {
    // If ORACLE_CLIENT is set in .env, use it first
    const envDir = process.env.ORACLE_CLIENT;

    // Common locations
    const linuxDirs = [
      "/opt/oracle/instantclient",
      "/opt/oracle/instantclient_23_9",
      "/opt/oracle/instantclient_23_8",
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
      console.log("🧩 Node-oracledb:", oracledb.versionString);
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

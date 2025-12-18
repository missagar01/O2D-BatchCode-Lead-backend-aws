const { Pool } = require('pg');
const config = require('./env');
const { logger } = require('../utils/logger.cjs');
const { getLocalPostgresPort, isTunnelActive } = require('./sshTunnel');

let mainPool;
let authPool;

// Function to reset main pool (useful for connection errors)
const resetMainPool = () => {
  if (mainPool) {
    logger.warn('🔄 Resetting main database pool due to connection error');
    mainPool.end().catch(() => {
      // Ignore errors during pool shutdown
    });
    mainPool = null;
  }
};

const buildConnectionOptions = (databaseConfig) => {
  if (config.databaseUrl && databaseConfig === config.postgres) {
    return {
      connectionString: config.databaseUrl,
      ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false
    };
  }

  const { host, port, user, password, database, ssl } = databaseConfig;
  if (!host || !user || !database) {
    return null;
  }

  // AWS RDS requires SSL, so enable it automatically for RDS hosts
  const isRDS = host.includes("rds.amazonaws.com");
  const useSSL = isRDS || ssl;

  // Check if we should use SSH tunnel (if SSH_HOST is set and tunnel is actually active)
  // For AWS RDS, don't use SSH tunnel - connect directly
  const useTunnel = process.env.SSH_HOST && isTunnelActive() && !isRDS;
  const finalHost = useTunnel ? '127.0.0.1' : host;
  const finalPort = useTunnel ? getLocalPostgresPort() : port;

  if (useTunnel) {
    logger.info(`📡 Database: Using SSH tunnel (localhost:${finalPort}) for ${database}`);
  } else {
    logger.info(`📡 Database: Using direct connection (${finalHost}:${finalPort}) for ${database}${useSSL ? ' (SSL enabled)' : ''}`);
  }

  return {
    host: finalHost,
    port: finalPort,
    user,
    password,
    database,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    // Additional connection options for SSH tunnel stability
    connectionTimeoutMillis: useTunnel ? 30000 : (isRDS ? 20000 : 15000), // Longer timeout for RDS
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
  };
};

const ensureQcLabSamplesTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS qc_lab_samples (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      sms_batch_code VARCHAR(50) NOT NULL,
      furnace_number VARCHAR(50) NOT NULL,
      sequence_code VARCHAR(10) NOT NULL,
      laddle_number INTEGER NOT NULL,
      shift_type VARCHAR(20) NOT NULL,

      final_c NUMERIC(10,4),
      final_mn NUMERIC(10,4),
      final_s NUMERIC(10,4),
      final_p NUMERIC(10,4),

      tested_by VARCHAR(100),
      remarks TEXT,
      report_picture TEXT,
      unique_code VARCHAR(50),

      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'qc_lab_samples' AND column_name = 'code'
      ) THEN
        ALTER TABLE qc_lab_samples RENAME COLUMN code TO unique_code;
      END IF;
    END $$;
  `);
  await mainPool.query('ALTER TABLE qc_lab_samples ADD COLUMN IF NOT EXISTS unique_code VARCHAR(50)');
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_qc_lab_samples_unique_code ON qc_lab_samples (unique_code)');
  logger.info('Ensured qc_lab_samples table and unique code index exist');
};

const ensureSmsRegisterTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS sms_register (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      sequence_number VARCHAR(10),
      laddle_number INTEGER,

      sms_head VARCHAR(150),
      furnace_number VARCHAR(50),

      remarks TEXT,
      picture TEXT,

      shift_incharge VARCHAR(100),
      temperature VARCHAR(50),
      update_link VARCHAR(255),

      unique_code VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_register_unique_code ON sms_register (unique_code)');
  await mainPool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sms_register' AND column_name = 'temprature'
      ) THEN
        ALTER TABLE sms_register RENAME COLUMN temprature TO temperature;
      END IF;
    END $$;
  `);
  await mainPool.query('ALTER TABLE sms_register ADD COLUMN IF NOT EXISTS picture TEXT');
  await mainPool.query('ALTER TABLE sms_register ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  await mainPool.query('ALTER TABLE sms_register ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query('ALTER TABLE sms_register ADD COLUMN IF NOT EXISTS update_link VARCHAR(255)');
  await mainPool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sms_register' AND column_name = 'temperature'
      ) THEN
        ALTER TABLE sms_register ALTER COLUMN temperature TYPE VARCHAR(50) USING temperature::text;
      ELSE
        ALTER TABLE sms_register ADD COLUMN temperature VARCHAR(50);
      END IF;
    END $$;
  `);
  logger.info('Ensured sms_register table and unique code index exist');
};

const ensureHotCoilTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS hot_coil (
      id SERIAL PRIMARY KEY,
      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      sms_short_code TEXT,
      submission_type TEXT,
      size TEXT,
      mill_incharge TEXT,
      quality_supervisor TEXT,
      picture TEXT,
      electrical_dc_operator TEXT,
      remarks TEXT,
      strand1_temperature TEXT,
      strand2_temperature TEXT,
      shift_supervisor TEXT,
      unique_code TEXT,
      update_link VARCHAR(255)
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_hot_coil_unique_code ON hot_coil (unique_code)');
  await mainPool.query('ALTER TABLE hot_coil ADD COLUMN IF NOT EXISTS submission_type TEXT');
  await mainPool.query('ALTER TABLE hot_coil ADD COLUMN IF NOT EXISTS picture TEXT');
  await mainPool.query('ALTER TABLE hot_coil ADD COLUMN IF NOT EXISTS update_link VARCHAR(255)');
  logger.info('Ensured hot_coil table and unique code index exist');
};

const ensurePipeMillTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS pipe_mill (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      recoiler_short_code VARCHAR(50) NOT NULL,
      mill_number VARCHAR(100) NOT NULL,
      section VARCHAR(50),
      item_type VARCHAR(50),

      quality_supervisor VARCHAR(100) NOT NULL,
      mill_incharge VARCHAR(100) NOT NULL,
      forman_name VARCHAR(100) NOT NULL,
      fitter_name VARCHAR(100) NOT NULL,

      shift VARCHAR(20) NOT NULL,
      size VARCHAR(50) NOT NULL,
      thickness VARCHAR(30),

      remarks TEXT,
      picture TEXT,

      unique_code VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pipe_mill_unique_code ON pipe_mill (unique_code)');
  await mainPool.query('ALTER TABLE pipe_mill ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS recoiler_short_code VARCHAR(50)');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS section VARCHAR(50)');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS item_type VARCHAR(50)');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS thickness VARCHAR(30)');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS picture TEXT');
  await mainPool.query('ALTER TABLE pipe_mill ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  logger.info('Ensured pipe_mill table and unique code index exist');
};

const ensureReCoilerTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS re_coiler (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      hot_coiler_short_code VARCHAR(50) NOT NULL,
      size VARCHAR(50),
      supervisor VARCHAR(100),
      incharge VARCHAR(100),
      contractor VARCHAR(100),
      machine_number VARCHAR(50),
      welder_name VARCHAR(100),

      unique_code VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  // Allow duplicate unique_code values per requirements; drop legacy unique index if it exists.
  await mainPool.query('DROP INDEX IF EXISTS idx_re_coiler_unique_code');
  await mainPool.query('ALTER TABLE re_coiler ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS size VARCHAR(50)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS supervisor VARCHAR(100)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS incharge VARCHAR(100)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS contractor VARCHAR(100)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS machine_number VARCHAR(50)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS welder_name VARCHAR(100)');
  await mainPool.query('ALTER TABLE re_coiler ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  await mainPool.query('ALTER TABLE re_coiler ALTER COLUMN unique_code SET NOT NULL');
  logger.info('Ensured re_coiler table and unique code index exist');
};

const ensureTundishChecklistTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS tundish_checklist (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      tundish_number INTEGER,

      nozzle_plate_check TEXT,
      well_block_check TEXT,
      board_proper_set TEXT,
      board_sand_filling TEXT,
      refractory_slag_cleaning TEXT,
      tundish_mession_name TEXT,
      handover_proper_check TEXT,
      handover_nozzle_installed TEXT,
      handover_masala_inserted TEXT,
      stand1_mould_operator TEXT,
      stand2_mould_operator TEXT,
      timber_man_name TEXT,
      laddle_operator_name TEXT,
      shift_incharge_name TEXT,
      forman_name TEXT,
      unique_code TEXT
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_tundish_checklist_unique_code ON tundish_checklist (unique_code)');
  await mainPool.query('ALTER TABLE tundish_checklist ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tundish_checklist' AND column_name = 'sample_date'
      ) THEN
        ALTER TABLE tundish_checklist DROP COLUMN sample_date;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tundish_checklist' AND column_name = 'sample_time'
      ) THEN
        ALTER TABLE tundish_checklist DROP COLUMN sample_time;
      END IF;
    END $$;
  `);

  await mainPool.query('ALTER TABLE tundish_checklist ALTER COLUMN unique_code SET NOT NULL');
  logger.info('Ensured tundish_checklist table and unique code index exist');
};

const ensureLaddleChecklistTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS laddle_checklist (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      sample_date DATE NOT NULL,
      laddle_number INTEGER NOT NULL,

      slag_cleaning_top VARCHAR(50),
      slag_cleaning_bottom VARCHAR(50),
      nozzle_proper_lancing VARCHAR(50),
      pursing_plug_cleaning VARCHAR(50),
      sly_gate_check VARCHAR(50),
      nozzle_check_cleaning VARCHAR(50),
      sly_gate_operate VARCHAR(50),
      nfc_proper_heat VARCHAR(50),
      nfc_filling_nozzle VARCHAR(50),

      plate_life INTEGER,

      timber_man_name VARCHAR(100),
      laddle_man_name VARCHAR(100),
      laddle_foreman_name VARCHAR(100),
      supervisor_name VARCHAR(100),

      unique_code VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_laddle_checklist_unique_code ON laddle_checklist (unique_code)');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN sample_date TYPE DATE USING sample_date::date');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN sample_date SET NOT NULL');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN laddle_number TYPE INTEGER USING laddle_number::integer');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN laddle_number SET NOT NULL');
  await mainPool.query('ALTER TABLE laddle_checklist ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  await mainPool.query('ALTER TABLE laddle_checklist ALTER COLUMN unique_code SET NOT NULL');
  logger.info('Ensured laddle_checklist table and unique code index exist');
};


const ensureLaddleReturnTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS laddle_return (
      id SERIAL PRIMARY KEY,

      sample_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      laddle_return_date DATE NOT NULL,
      laddle_return_time TIME NOT NULL,

      poring_temperature VARCHAR(100),
      poring_temperature_photo TEXT,

      furnace_shift_incharge VARCHAR(100),
      furnace_crane_driver VARCHAR(100),

      ccm_temperature_before_pursing VARCHAR(100),
      ccm_temp_before_pursing_photo TEXT,
      ccm_temp_after_pursing_photo TEXT,

      ccm_crane_driver VARCHAR(100),
      stand1_mould_operator VARCHAR(100),
      stand2_mould_operator VARCHAR(100),

      shift_incharge VARCHAR(100),
      timber_man VARCHAR(100),
      operation_incharge VARCHAR(100),

      laddle_return_reason TEXT,
      unique_code VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_laddle_return_unique_code ON laddle_return (unique_code)');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN sample_timestamp SET DEFAULT CURRENT_TIMESTAMP');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN laddle_return_date TYPE DATE USING laddle_return_date::date');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN laddle_return_date SET NOT NULL');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN laddle_return_time TYPE TIME USING laddle_return_time::time');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN laddle_return_time SET NOT NULL');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN poring_temperature TYPE VARCHAR(100)');
  await mainPool.query('ALTER TABLE laddle_return ADD COLUMN IF NOT EXISTS poring_temperature_photo TEXT');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN ccm_temperature_before_pursing TYPE VARCHAR(100)');
  await mainPool.query('ALTER TABLE laddle_return ADD COLUMN IF NOT EXISTS ccm_temp_before_pursing_photo TEXT');
  await mainPool.query('ALTER TABLE laddle_return ADD COLUMN IF NOT EXISTS ccm_temp_after_pursing_photo TEXT');
  await mainPool.query('ALTER TABLE laddle_return ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN unique_code TYPE VARCHAR(20)');
  await mainPool.query('ALTER TABLE laddle_return ALTER COLUMN unique_code SET NOT NULL');
  const nullableColumns = [
    'furnace_shift_incharge',
    'furnace_crane_driver',
    'ccm_crane_driver',
    'stand1_mould_operator',
    'stand2_mould_operator',
    'shift_incharge',
    'timber_man',
    'operation_incharge',
    'laddle_return_reason'
  ];
  for (const column of nullableColumns) {
    await mainPool.query(`ALTER TABLE laddle_return ALTER COLUMN ${column} DROP NOT NULL`);
  }
  logger.info('Ensured laddle_return table and unique code index exist');
};

const ensureLoginTable = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS login (
      id BIGSERIAL PRIMARY KEY,
      create_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      user_name VARCHAR(150) NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50),
      user_id VARCHAR(50),
      email VARCHAR(200),
      number VARCHAR(20),
      department VARCHAR(100),
      give_by VARCHAR(150),
      status VARCHAR(20) DEFAULT 'ACTIVE',
      user_acess VARCHAR(200),
      employee_id VARCHAR(50),
      createdate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updatedate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await mainPool.query(ddl);
  await mainPool.query(`
    CREATE OR REPLACE FUNCTION trigger_set_updatedate()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updatedate = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await mainPool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_login_updatedate'
      ) THEN
        CREATE TRIGGER trg_login_updatedate
        BEFORE UPDATE ON login
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_updatedate();
      END IF;
    END $$;
  `);
  logger.info('Ensured login table exists');
};

const ensureAuthUsersTable = async () => {
  if (!authPool) {
    return;
  }
  const ddl = `
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      user_name VARCHAR(150) UNIQUE,
      username VARCHAR(150),
      employee_id VARCHAR(150) UNIQUE,
      password TEXT,
      password_hash TEXT,
      role VARCHAR(50) DEFAULT 'user',
      user_status VARCHAR(50) DEFAULT 'active',
      email_id VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await authPool.query(ddl);
  await authPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name)');
  await authPool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_id ON public.users (employee_id)');
  logger.info('Ensured auth users table exists');
};

const connectDatabase = async () => {
  if (mainPool) {
    return mainPool;
  }

  const options = buildConnectionOptions(config.postgres);
  if (!options) {
    logger.warn('Database configuration missing. Skipping main database connection.');
    return null;
  }

  // Retry connection with exponential backoff
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      mainPool = new Pool({
        ...options,
        connectionTimeoutMillis: options.connectionTimeoutMillis || 30000,
        idleTimeoutMillis: options.idleTimeoutMillis || 30000,
        max: 10,
        // Additional options for stability
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
      
      mainPool.on('error', (error) => {
        logger.error('Unexpected PostgreSQL client error', error);
        // Reset pool on error to force reconnection
        if (error.message.includes('terminated') || error.message.includes('Connection terminated')) {
          logger.warn('⚠️ Connection terminated, resetting pool');
          resetMainPool();
        }
      });
      
      // Handle connection errors
      mainPool.on('connect', (client) => {
        client.on('error', (err) => {
          logger.error('PostgreSQL client connection error:', err.message);
          // Reset pool on client connection errors
          if (err.message.includes('terminated') || err.message.includes('Connection terminated')) {
            resetMainPool();
          }
        });
      });

      // Test connection with longer timeout for SSH tunnel
      const testTimeout = process.env.SSH_HOST ? 30000 : 15000;
      await Promise.race([
        mainPool.query('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), testTimeout)
        )
      ]);
      
      logger.info('Main database connection established');

      await ensureQcLabSamplesTable();
      await ensureSmsRegisterTable();
      await ensureHotCoilTable();
      await ensurePipeMillTable();
      await ensureReCoilerTable();
      await ensureTundishChecklistTable();
      await ensureLaddleChecklistTable();
      await ensureLaddleReturnTable();
      await ensureLoginTable();
      return mainPool;
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || 'Unknown error';
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed:`, errorMsg);
      
      if (mainPool) {
        try {
          await mainPool.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        mainPool = null;
      }
      
      if (attempt < maxRetries) {
        // Longer delay for SSH tunnel connections
        const baseDelay = process.env.SSH_HOST ? 2000 : 1000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error('Database connection failed after all retries', lastError);
  throw lastError;
};

const connectAuthDatabase = async () => {
  if (authPool) {
    return authPool;
  }

  const options = buildConnectionOptions(config.authDatabase);
  if (!options) {
    logger.warn('Auth database configuration missing. Skipping auth database connection.');
    return null;
  }

  // Retry connection with exponential backoff
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      authPool = new Pool({
        ...options,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10,
      });
      
      authPool.on('error', (error) => {
        logger.error('Unexpected PostgreSQL auth client error', error);
      });

      // Test connection with timeout
      await Promise.race([
        authPool.query('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      logger.info('Auth database connection established');
      await ensureAuthUsersTable();
      return authPool;
    } catch (error) {
      lastError = error;
      logger.warn(`Auth database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (authPool) {
        try {
          await authPool.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        authPool = null;
      }
      
      if (attempt < maxRetries) {
        // Longer delay for SSH tunnel connections
        const baseDelay = process.env.SSH_HOST ? 2000 : 1000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error('Auth database connection failed after all retries', lastError);
  throw lastError;
};

const getPool = () => {
  if (!mainPool) {
    // Try to build connection options and create pool synchronously
    // This handles cases where connectDatabase() hasn't been called yet
    const options = buildConnectionOptions(config.postgres);
    if (options) {
      // Log connection details for debugging (without password)
      logger.info(`🔌 Creating database pool: ${options.user}@${options.host}:${options.port}/${options.database}`);
      
      mainPool = new Pool({
        ...options,
        connectionTimeoutMillis: options.connectionTimeoutMillis || 30000,
        idleTimeoutMillis: options.idleTimeoutMillis || 30000,
        max: 10,
        // Additional options for stability
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
      
      mainPool.on('error', (error) => {
        logger.error('Unexpected PostgreSQL client error', error);
        // Reset pool on error to force reconnection
        if (error.message.includes('terminated') || error.message.includes('Connection terminated')) {
          logger.warn('⚠️ Connection terminated, resetting pool');
          resetMainPool();
        }
      });
      
      // Handle connection errors
      mainPool.on('connect', (client) => {
        client.on('error', (err) => {
          logger.error('PostgreSQL client connection error:', err.message);
          // Reset pool on client connection errors
          if (err.message.includes('terminated') || err.message.includes('Connection terminated')) {
            resetMainPool();
          }
        });
      });
      
      logger.warn('⚠️ Database pool created on-demand. Consider calling connectDatabase() during server startup.');
    } else {
      const missing = [];
      if (!config.postgres.host) missing.push('PG_HOST or DB_HOST');
      if (!config.postgres.user) missing.push('PG_USER or DB_USER');
      if (!config.postgres.database) missing.push('PG_DATABASE or DB_NAME');
      throw new Error(`Database has not been initialized. Missing: ${missing.join(', ')}. Check your .env file (lines 18-31).`);
    }
  }
  return mainPool;
};

const getAuthPool = () => {
  if (!authPool) {
    throw new Error('Auth database has not been initialized. Call connectAuthDatabase() first.');
  }
  return authPool;
};

module.exports = { connectDatabase, getPool, connectAuthDatabase, getAuthPool, resetMainPool };

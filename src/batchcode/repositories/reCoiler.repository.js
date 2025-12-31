const { getPool } = require('../config/database');

const insertReCoiler = async (payload) => {
  const {
    sample_timestamp,
    hot_coiler_short_code,
    size = null,
    supervisor = null,
    incharge = null,
    contractor = null,
    machine_number = null,
    welder_name = null,
    unique_code
  } = payload;

  // Ensure sequence exists and use it for id
  const pool = getPool();
  try {
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS re_coiler_id_seq;
      SELECT setval('re_coiler_id_seq', COALESCE((SELECT MAX(id) FROM re_coiler), 0) + 1, false);
    `);
  } catch (seqError) {
    // If sequence creation fails, try to set it if it exists
    try {
      await pool.query(`SELECT setval('re_coiler_id_seq', COALESCE((SELECT MAX(id) FROM re_coiler), 0) + 1, false);`);
    } catch (e) {
      // Ignore - sequence might not exist, will use DEFAULT
    }
  }

  // Use nextval for id, or DEFAULT if sequence doesn't work
  const query = `
    INSERT INTO re_coiler (
      id,
      sample_timestamp,
      hot_coiler_short_code,
      size,
      supervisor,
      incharge,
      contractor,
      machine_number,
      welder_name,
      unique_code
    )
    VALUES (
      nextval('re_coiler_id_seq'),
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    )
    RETURNING *
  `;

  const values = [
    sample_timestamp ?? null,
    hot_coiler_short_code,
    size,
    supervisor,
    incharge,
    contractor,
    machine_number,
    welder_name,
    unique_code
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findReCoilerEntries = async ({ id, uniqueCode } = {}) => {
  const filters = [];
  const values = [];

  if (typeof id === 'number') {
    values.push(id);
    filters.push(`id = $${values.length}`);
  }

  if (typeof uniqueCode === 'string') {
    values.push(uniqueCode);
    filters.push(`unique_code = $${values.length}`);
  }

  let query = `
    SELECT *
    FROM re_coiler
  `;

  if (filters.length) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertReCoiler, findReCoilerEntries };

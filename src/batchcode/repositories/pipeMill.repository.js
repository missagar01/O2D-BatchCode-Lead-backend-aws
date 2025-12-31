const { getPool } = require('../config/database');

const insertPipeMill = async (payload) => {
  const {
    sample_timestamp,
    recoiler_short_code,
    mill_number,
    section = null,
    item_type = null,
    quality_supervisor,
    mill_incharge,
    forman_name,
    fitter_name,
    shift,
    size,
    thickness = null,
    remarks = null,
    picture = null,
    unique_code
  } = payload;

  // Ensure sequence exists and use it for id
  const pool = getPool();
  try {
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS pipe_mill_id_seq;
      SELECT setval('pipe_mill_id_seq', COALESCE((SELECT MAX(id) FROM pipe_mill), 0) + 1, false);
    `);
  } catch (seqError) {
    // If sequence creation fails, try to set it if it exists
    try {
      await pool.query(`SELECT setval('pipe_mill_id_seq', COALESCE((SELECT MAX(id) FROM pipe_mill), 0) + 1, false);`);
    } catch (e) {
      // Ignore - sequence might not exist, will use DEFAULT
    }
  }

  // Use nextval for id, or DEFAULT if sequence doesn't work
  const query = `
    INSERT INTO pipe_mill (
      id,
      sample_timestamp,
      recoiler_short_code,
      mill_number,
      section,
      item_type,
      quality_supervisor,
      mill_incharge,
      forman_name,
      fitter_name,
      shift,
      size,
      thickness,
      remarks,
      picture,
      unique_code
    )
    VALUES (
      nextval('pipe_mill_id_seq'),
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15
    )
    RETURNING *
  `;

  const values = [
    sample_timestamp ?? null,
    recoiler_short_code,
    mill_number,
    section,
    item_type,
    quality_supervisor,
    mill_incharge,
    forman_name,
    fitter_name,
    shift,
    size,
    thickness,
    remarks,
    picture, // This is already a URL from fileUpload middleware
    unique_code
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findPipeMillEntries = async ({ id, uniqueCode } = {}) => {
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
    FROM pipe_mill
  `;

  if (filters.length) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertPipeMill, findPipeMillEntries };

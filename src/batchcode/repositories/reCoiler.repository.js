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

  const query = `
    INSERT INTO re_coiler (
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

  const { rows } = await getPool().query(query, values);
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

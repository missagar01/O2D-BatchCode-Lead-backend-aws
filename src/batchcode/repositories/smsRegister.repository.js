const { query } = require('../utils/dbQuery');

const countByDate = async (dateISO) => {
  const queryText = `
    SELECT COUNT(*)::int AS total
    FROM sms_register
    WHERE DATE(sample_timestamp) = $1::date
  `;

  const result = await query(queryText, [dateISO]);
  return result.rows[0]?.total ?? 0;
};

const insertSmsRegister = async (payload) => {
  const {
    sample_timestamp,
    sequence_number,
    laddle_number,
    sms_head,
    furnace_number,
    remarks = null,
    picture = null,
    shift_incharge,
    temperature,
    unique_code
  } = payload;

  const queryText = `
    INSERT INTO sms_register (
      sample_timestamp,
      sequence_number,
      laddle_number,
      sms_head,
      furnace_number,
      remarks,
      picture,
      shift_incharge,
      temperature,
      unique_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    sample_timestamp ?? null,
    sequence_number,
    laddle_number ?? null,
    sms_head,
    furnace_number,
    remarks,
    picture,
    shift_incharge,
    temperature ?? null,
    unique_code
  ];

  const result = await query(queryText, values);
  return result.rows[0];
};

const findSmsRegisters = async ({ id, uniqueCode } = {}) => {
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

  let queryText = `
    SELECT *
    FROM sms_register
  `;

  if (filters.length > 0) {
    queryText += ` WHERE ${filters.join(' OR ')}`;
  }

  queryText += ' ORDER BY sample_timestamp ASC NULLS LAST, id ASC';

  const result = await query(queryText, values);
  return result.rows;
};

module.exports = { insertSmsRegister, findSmsRegisters, countByDate };

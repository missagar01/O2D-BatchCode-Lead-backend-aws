const { getPool } = require('../config/database');

const insertHotCoil = async (payload) => {
  const {
    sample_timestamp,
    sms_short_code,
    submission_type,
    size = null,
    mill_incharge = null,
    quality_supervisor = null,
    picture = null,
    electrical_dc_operator = null,
    remarks = null,
    strand1_temperature = null,
    strand2_temperature = null,
    shift_supervisor = null,
    unique_code
  } = payload;

  const query = `
    INSERT INTO hot_coil (
      sample_timestamp,
      sms_short_code,
      submission_type,
      size,
      mill_incharge,
      quality_supervisor,
      picture,
      electrical_dc_operator,
      remarks,
      strand1_temperature,
      strand2_temperature,
      shift_supervisor,
      unique_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const values = [
    sample_timestamp ?? null,
    sms_short_code,
    submission_type,
    size,
    mill_incharge,
    quality_supervisor,
    picture,
    electrical_dc_operator,
    remarks,
    strand1_temperature,
    strand2_temperature,
    shift_supervisor,
    unique_code
  ];

  const { rows } = await getPool().query(query, values);
  return rows[0];
};

const findHotCoilEntries = async ({ id, uniqueCode, smsShortCode } = {}) => {
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

  if (typeof smsShortCode === 'string') {
    values.push(smsShortCode);
    filters.push(`sms_short_code = $${values.length}`);
  }

  let query = `
    SELECT *
    FROM hot_coil
  `;

  if (filters.length) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertHotCoil, findHotCoilEntries };

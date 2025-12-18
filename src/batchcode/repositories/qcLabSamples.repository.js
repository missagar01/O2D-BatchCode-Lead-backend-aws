const { getPool } = require('../config/database');

const insertSample = async (payload) => {
  const {
    sample_timestamp,
    sms_batch_code,
    furnace_number,
    sequence_code,
    laddle_number,
    shift_type,
    final_c,
    final_mn,
    final_s,
    final_p,
    tested_by,
    remarks = null,
    report_picture = null,
    unique_code
  } = payload;

  const timestampValue = sample_timestamp ?? new Date().toISOString();

  const query = `
    INSERT INTO qc_lab_samples (
      sample_timestamp,
      sms_batch_code,
      furnace_number,
      sequence_code,
      laddle_number,
      shift_type,
      final_c,
      final_mn,
      final_s,
      final_p,
      tested_by,
      remarks,
      report_picture,
      unique_code
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14
    )
    RETURNING *
  `;

  const values = [
    timestampValue,
    sms_batch_code,
    furnace_number,
    sequence_code,
    laddle_number,
    shift_type,
    final_c ?? null,
    final_mn ?? null,
    final_s ?? null,
    final_p ?? null,
    tested_by,
    remarks,
    report_picture,
    unique_code
  ];

  const { rows } = await getPool().query(query, values);
  return rows[0];
};

const findSamples = async ({ id, uniqueCode } = {}) => {
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
    FROM qc_lab_samples
  `;

  if (filters.length > 0) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertSample, findSamples };

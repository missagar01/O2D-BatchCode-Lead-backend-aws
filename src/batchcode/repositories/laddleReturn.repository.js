const { getPool } = require('../config/database');

const insertLaddleReturn = async (payload) => {
  const {
    sample_timestamp,
    laddle_return_date,
    laddle_return_time,
    poring_temperature = null,
    poring_temperature_photo = null,
    furnace_shift_incharge = null,
    furnace_crane_driver = null,
    ccm_temperature_before_pursing = null,
    ccm_temp_before_pursing_photo = null,
    ccm_temp_after_pursing_photo = null,
    ccm_crane_driver = null,
    stand1_mould_operator = null,
    stand2_mould_operator = null,
    shift_incharge = null,
    timber_man = null,
    operation_incharge = null,
    laddle_return_reason = null,
    unique_code
  } = payload;

  const query = `
    INSERT INTO laddle_return (
      sample_timestamp,
      laddle_return_date,
      laddle_return_time,
      poring_temperature,
      poring_temperature_photo,
      furnace_shift_incharge,
      furnace_crane_driver,
      ccm_temperature_before_pursing,
      ccm_temp_before_pursing_photo,
      ccm_temp_after_pursing_photo,
      ccm_crane_driver,
      stand1_mould_operator,
      stand2_mould_operator,
      shift_incharge,
      timber_man,
      operation_incharge,
      laddle_return_reason,
      unique_code
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18
    )
    RETURNING *
  `;

  const values = [
    sample_timestamp ?? null,
    laddle_return_date,
    laddle_return_time,
    poring_temperature,
    poring_temperature_photo,
    furnace_shift_incharge,
    furnace_crane_driver,
    ccm_temperature_before_pursing,
    ccm_temp_before_pursing_photo,
    ccm_temp_after_pursing_photo,
    ccm_crane_driver,
    stand1_mould_operator,
    stand2_mould_operator,
    shift_incharge,
    timber_man,
    operation_incharge,
    laddle_return_reason,
    unique_code
  ];

  const { rows } = await getPool().query(query, values);
  return rows[0];
};

const findLaddleReturns = async ({ id, uniqueCode } = {}) => {
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
    FROM laddle_return
  `;

  if (filters.length) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertLaddleReturn, findLaddleReturns };

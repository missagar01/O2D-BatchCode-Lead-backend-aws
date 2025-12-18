const { getPool } = require('../config/database');

const insertLaddleChecklist = async (payload) => {
  const {
    sample_timestamp,
    laddle_number,
    sample_date,
    slag_cleaning_top = null,
    slag_cleaning_bottom = null,
    nozzle_proper_lancing = null,
    pursing_plug_cleaning = null,
    sly_gate_check = null,
    nozzle_check_cleaning = null,
    sly_gate_operate = null,
    nfc_proper_heat = null,
    nfc_filling_nozzle = null,
    plate_life,
    timber_man_name = null,
    laddle_man_name = null,
    laddle_foreman_name = null,
    supervisor_name = null,
    unique_code
  } = payload;

  const query = `
    INSERT INTO laddle_checklist (
      sample_timestamp,
      laddle_number,
      sample_date,
      slag_cleaning_top,
      slag_cleaning_bottom,
      nozzle_proper_lancing,
      pursing_plug_cleaning,
      sly_gate_check,
      nozzle_check_cleaning,
      sly_gate_operate,
      nfc_proper_heat,
      nfc_filling_nozzle,
      plate_life,
      timber_man_name,
      laddle_man_name,
      laddle_foreman_name,
      supervisor_name,
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
    laddle_number ?? null,
    sample_date ?? null,
    slag_cleaning_top,
    slag_cleaning_bottom,
    nozzle_proper_lancing,
    pursing_plug_cleaning,
    sly_gate_check,
    nozzle_check_cleaning,
    sly_gate_operate,
    nfc_proper_heat,
    nfc_filling_nozzle,
    plate_life ?? null,
    timber_man_name,
    laddle_man_name,
    laddle_foreman_name,
    supervisor_name,
    unique_code
  ];

  const { rows } = await getPool().query(query, values);
  return rows[0];
};

const findLaddleChecklists = async ({ id, uniqueCode } = {}) => {
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
    FROM laddle_checklist
  `;

  if (filters.length) {
    query += ` WHERE ${filters.join(' OR ')}`;
  }

  query += ' ORDER BY sample_timestamp DESC NULLS LAST, id DESC';

  const { rows } = await getPool().query(query, values);
  return rows;
};

module.exports = { insertLaddleChecklist, findLaddleChecklists };

const { getConnection } = require("../config/db.js");
const oracledb = require("oracledb");

// 🟢 Pending Second Weight with Filters
async function getPendingSecondWeight(offset = 0, limit = 50, customer = '', search = '') {
  let whereClause = `
    WHERE t.entity_code = 'SR'
      AND t.tcode = 'S'
      AND t.outdate IS NULL
      AND t.div_code = 'PM'
      AND t.vrdate >= TRUNC(SYSDATE)
  `;

  // Add customer filter
  if (customer) {
    whereClause += ` AND UPPER(t.acc_remark) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    whereClause += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.acc_remark) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslipno) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) AS total_count
    FROM view_weighbridge_engine t
    ${whereClause}
  `;

  // Data query
  const dataQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT 
          t.indate + INTERVAL '4' HOUR AS planned_timestamp,
          t.indate,
          t.order_vrno,
          t.gate_vrno,
          t.wslipno,
          t.acc_remark,
          t.truckno
        FROM view_weighbridge_engine t
        ${whereClause}
        ORDER BY t.indate ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;

  try {
    connection = await getConnection();
    const [countResult, dataResult] = await Promise.all([
      connection.execute(countQuery, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(dataQuery, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    ]);
    return {
      data: dataResult.rows,
      totalCount: countResult.rows[0]?.TOTAL_COUNT || 0
    };
  } catch (error) {
    console.error("Error fetching pending second weight:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟣 Second Weight History with Filters
async function getSecondWeightHistory(offset = 0, limit = 50, customer = '', search = '') {
  let whereClause = `
    WHERE t.entity_code = 'SR'
      AND t.tcode = 'S'
      AND t.outdate IS NOT NULL
      AND t.div_code = 'PM'
      AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
  `;

  // Add customer filter
  if (customer) {
    whereClause += ` AND UPPER(t.acc_remark) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    whereClause += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.acc_remark) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslipno) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) AS total_count
    FROM view_weighbridge_engine t
    ${whereClause}
  `;

  // Data query
  const dataQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT 
          t.indate + INTERVAL '4' HOUR AS planned_timestamp,
          t.outdate,
          t.indate,
          t.order_vrno,
          t.gate_vrno,
          t.wslipno,
          t.acc_remark,
          t.truckno
        FROM view_weighbridge_engine t
        ${whereClause}
        ORDER BY t.outdate ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;

  try {
    connection = await getConnection();
    const [countResult, dataResult] = await Promise.all([
      connection.execute(countQuery, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(dataQuery, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    ]);
    return {
      data: dataResult.rows,
      totalCount: countResult.rows[0]?.TOTAL_COUNT || 0
    };
  } catch (error) {
    console.error("Error fetching second weight history:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { getPendingSecondWeight, getSecondWeightHistory };

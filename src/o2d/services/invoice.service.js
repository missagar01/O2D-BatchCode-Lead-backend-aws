const { getConnection } = require("../config/db.js");
const oracledb = require("oracledb");

async function getPendingInvoiceData(offset = 0, limit = 50, customer = '', search = '') {
  let whereClause = `
    WHERE t.entity_code = 'SR'
      AND t.tcode = 'S'
      AND t.outdate IS NOT NULL
      AND t.div_code = 'PM'
      AND t.outdate >= TRUNC(SYSDATE)
      AND t.wslipno NOT IN (
        SELECT DISTINCT a.wslipno
        FROM view_itemtran_engine a
        WHERE a.order_vrno = t.order_vrno
          AND a.tcode = 'S'
      )
      AND (
        SELECT a.netwt 
        FROM view_weighbridge_engine a 
        WHERE a.wslipno = t.wslipno 
          AND a.entity_code = 'SR' 
          AND a.slno = 1
      ) <> 0
  `;

  // 🔍 Customer filter
  if (customer) {
    whereClause += ` AND UPPER(t.acc_remark) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // 🔍 Search filter
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
          t.outdate + INTERVAL '30' MINUTE AS planned_timestamp,
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
    console.error("Error fetching pending invoice data:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟣 Invoice History Data with Filters
async function getInvoiceHistoryData(offset = 0, limit = 50, customer = '', search = '') {
  let whereClause = `
    WHERE t.entity_code = 'SR'
      AND t.series = 'SA'
      AND t.div_code = 'PM'
      AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
  `;

  // Add customer filter
  if (customer) {
    whereClause += ` AND UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    whereClause += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslipno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.waybillno) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(DISTINCT t.vrno) AS total_count
    FROM view_itemtran_engine t
    ${whereClause}
  `;

  // Data query
  const dataQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT DISTINCT 
          (
            SELECT DISTINCT a.outdate 
            FROM view_weighbridge_engine a 
            WHERE a.wslipno = t.wslipno 
              AND a.slno = 1 
              AND a.entity_code = 'SR'
          ) + INTERVAL '30' MINUTE AS planned_timestamp,
          t.lastupdate AS actual_timestamp,
          t.order_vrno,
          t.gate_vrno,
          t.wslipno,
          t.vrno AS invoice_no,
          lhs_utility.get_name('acc_code', t.acc_code) AS party_name,
          t.truckno,
          t.waybillno
        FROM view_itemtran_engine t
        ${whereClause}
        ORDER BY t.lastupdate ASC
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
    console.error("Error fetching invoice history data:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getPendingInvoiceData,
  getInvoiceHistoryData,
};

const { getConnection } = require("../config/db.js");
const oracledb = require("oracledb");
const { generateCacheKey, withCache, DEFAULT_TTL } = require("../utils/cacheHelper.js");

const gateProcessQuery = `
select to_char(t.vrdate,'dd/mm/yyyy hh:mi:ss') as gate_entry_timestamp,
       t.vrno as gate_entry_number,
       t.order_vrno as loading_order_number,
       lhs_utility.get_name('acc_code',t.acc_code) as party_name,
       t.truckno,
       t.Wslip_No,
       to_char(t.vrdate + INTERVAL '10' MINUTE,'dd/mm/yyyy hh:mi:ss') as first_weight_planned,
       to_char((select a.indate from view_weighbridge_engine a where a.wslipno = t.Wslip_No and a.entity_code = :entityCode),'dd/mm/yyyy hh:mi:ss') as first_weight_actual,
       to_char((select a.indate from view_weighbridge_engine a where a.wslipno = t.Wslip_No and a.entity_code = :entityCode) + INTERVAL '4' HOUR,'dd/mm/yyyy hh:mi:ss') as planned_second_weight,
       to_char((select a.outdate from view_weighbridge_engine a where a.wslipno = t.Wslip_No and a.entity_code = :entityCode),'dd/mm/yyyy hh:mi:ss') as actual_second_weight,
       to_char((select a.outdate from view_weighbridge_engine a where a.wslipno = t.Wslip_No and a.entity_code = :entityCode) + INTERVAL '10' MINUTE,'dd/mm/yyyy hh:mi:ss') as planned_invoice_timestamp,
       to_char((select distinct B.vrdate from view_itemtran_engine b where b.wslipno = t.Wslip_No and b.entity_code = :entityCode),'dd/mm/yyyy hh:mi:ss') as actual_invoice_timestamp,
       (select distinct B.vrno from view_itemtran_engine b where b.wslipno = t.Wslip_No and b.entity_code = :entityCode) as invoice_number,
       to_char((select distinct B.vrdate from view_itemtran_engine b where b.wslipno = t.Wslip_No and b.entity_code = :entityCode) + INTERVAL '30' MINUTE,'dd/mm/yyyy hh:mi:ss') as gate_out_planned,
       to_char(t.outdate,'dd/mm/yyyy hh:mi:ss') as gate_out_actual
from view_gatetran_engine t
where t.entity_code = :entityCode
      and t.series='SE'
      and t.outdate is null
order by to_char(t.vrdate,'dd/mm/yyyy hh:mi:ss') asc`;

async function getGateProcessTimeline(entityCode = "SR") {
  const cacheKey = generateCacheKey("gate-process:timeline", { entityCode });
  const ttl = parseInt(process.env.GATE_PROCESS_CACHE_TTL_SECONDS, 10) || DEFAULT_TTL.TIMELINE;
  
  return await withCache(cacheKey, ttl, async () => {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        gateProcessQuery,
        { entityCode },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows;
    } finally {
      if (connection) await connection.close();
    }
  });
}

module.exports = {
  getGateProcessTimeline,
};

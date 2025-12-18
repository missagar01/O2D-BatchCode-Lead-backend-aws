const { Router } = require("express");
const { getConnection } = require("../o2d/config/db.js");
const oracledb = require("oracledb");

const router = Router();

// GET /users - Fetch all rows from SRMPLERP.ACCBAL_AUDIT
router.get("/users", async (req, res) => {
  console.log("Fetching all users from ACCBAL_AUDIT...");
  let conn;
  try {
    conn = await getConnection();

    // Check schema exists
    const schemaCheck = await conn.execute(
      `SELECT username FROM all_users WHERE username = :schemaName`,
      { schemaName: 'SRMPLERP' },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (schemaCheck.rows.length === 0) {
      return res.status(404).json({ error: "Schema SRMPLERP does not exist" });
    }

    console.log("Schema SRMPLERP exists ✅");

    // Check table exists
    const tableCheck = await conn.execute(
      `SELECT table_name 
         FROM all_tables 
        WHERE owner = :schemaName 
          AND table_name = :tableName`,
      { schemaName: 'SRMPLERP', tableName: 'ACCBAL_AUDIT' },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ error: "Table ACCBAL_AUDIT does not exist in schema SRMPLERP" });
    }

    console.log("Table ACCBAL_AUDIT exists ✅");

    // Fetch data
    const result = await conn.execute(
      `SELECT * FROM SRMPLERP.ACCBAL_AUDIT`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("Rows fetched:", result.rows.length);
    res.json(result.rows);

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /schema - List all schemas and tables
router.get("/schema", async (req, res) => {
  console.log("Fetching all schemas and tables...");
  let conn;
  try {
    conn = await getConnection();

    // Get all schemas
    const schemasResult = await conn.execute(
      `SELECT username AS schema_name FROM all_users ORDER BY username`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const schemas = schemasResult.rows.map(r => r.SCHEMA_NAME);
    console.log("Schemas found:", schemas.length);

    // Get tables for each schema
    const schemaTables = {};

    for (let schema of schemas) {
      const tablesResult = await conn.execute(
        `SELECT table_name FROM all_tables WHERE owner = :schema ORDER BY table_name`,
        { schema },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      schemaTables[schema] = tablesResult.rows.map(r => r.TABLE_NAME);
    }

    res.json({
      totalSchemas: schemas.length,
      schemas: schemaTables
    });

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /current-schema - Get current schema name
router.get("/current-schema", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT sys_context('USERENV','CURRENT_SCHEMA') AS schema_name FROM dual`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /store-indent - Create a new store indent
router.post("/store-indent", async (req, res) => {
  let conn;
  try {
    const {
      timestamp,
      indenterName,
      department,
      groupHead,
      itemCode,
      productName,
      quantity,
      uom,
      specifications,
      indentApprovedBy,
      indentType,
      attachment,
    } = req.body;

    conn = await getConnection();

    // Fetch the last indent number
    const result = await conn.execute(
      `SELECT MAX(TO_NUMBER(REGEXP_SUBSTR(INDENT_NUMBER, '[0-9]+'))) AS LAST_NUM FROM STORE_INDENT`
    );

    const lastNum = result.rows[0][0] || 0;
    const newNum = lastNum + 1;
    const indentNumber = `SI-${String(newNum).padStart(4, '0')}`;

    // Insert with new indent number
    await conn.execute(
      `INSERT INTO STORE_INDENT 
       (TIMESTAMP, INDENT_NUMBER, INDENTER_NAME, DEPARTMENT, GROUP_HEAD, 
        ITEM_CODE, PRODUCT_NAME, QUANTITY, UOM, SPECIFICATIONS, 
        INDENT_APPROVED_BY, INDENT_TYPE, ATTACHMENT)
       VALUES (
         TO_TIMESTAMP(:timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
         :indentNumber,
         :indenterName,
         :department,
         :groupHead,
         :itemCode,
         :productName,
         :quantity,
         :uom,
         :specifications,
         :indentApprovedBy,
         :indentType,
         :attachment
       )`,
      {
        timestamp,
        indentNumber,
        indenterName,
        department,
        groupHead,
        itemCode,
        productName,
        quantity,
        uom,
        specifications,
        indentApprovedBy,
        indentType,
        attachment,
      },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Indent saved successfully", indentNumber });
  } catch (err) {
    console.error("Error inserting indent:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /store-indent/approve - Approve a store indent
router.put("/store-indent/approve", async (req, res) => {
  let conn;
  try {
    const { indentNumber, itemCode, vendorType, approvedQuantity } = req.body;

    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE STORE_INDENT
          SET VENDOR_TYPE = :vendorType,
              APPROVED_QUANTITY = :approvedQuantity,
              ACTUAL_1 = SYSDATE
        WHERE INDENT_NUMBER = :indentNumber
          AND ITEM_CODE = :itemCode`,
      { indentNumber, itemCode, vendorType, approvedQuantity },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Indent approved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /store-indent/pending - Get pending store indents
router.get("/store-indent/pending", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM STORE_INDENT 
        WHERE PLANNED_1 IS NOT NULL 
          AND ACTUAL_1 IS NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /store-indent/history - Get store indent history
router.get("/store-indent/history", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM STORE_INDENT 
        WHERE PLANNED_1 IS NOT NULL 
          AND ACTUAL_1 IS NOT NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /tables - List all tables in SRMPLERP schema
router.get("/tables", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT table_name 
         FROM all_tables 
        WHERE owner = :owner
        ORDER BY table_name`,
      ["SRMPLERP"],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;


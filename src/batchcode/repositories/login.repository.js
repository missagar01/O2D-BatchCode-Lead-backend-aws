const { getPool } = require('../config/database');

const insertLogin = async (payload) => {
  const {
    user_name,
    password,
    role,
    user_id,
    email,
    number,
    department,
    give_by,
    status,
    user_acess,
    employee_id
  } = payload;

  const query = `
    INSERT INTO login (
      user_name,
      password,
      role,
      user_id,
      email,
      number,
      department,
      give_by,
      status,
      user_acess,
      employee_id
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, COALESCE($9, 'ACTIVE'), $10, $11
    )
    RETURNING *
  `;

  const values = [
    user_name,
    password,
    role ?? null,
    user_id ?? null,
    email ?? null,
    number ?? null,
    department ?? null,
    give_by ?? null,
    status ?? null,
    user_acess ?? null,
    employee_id ?? null
  ];

  const { rows } = await getPool().query(query, values);
  return rows[0];
};

const findAllLogins = async () => {
  const query = `
    SELECT
      id,
      create_at,
      user_name,
      role,
      user_id,
      email,
      number,
      department,
      give_by,
      status,
      user_acess,
      employee_id,
      createdate,
      updatedate
    FROM login
    ORDER BY create_at DESC
  `;

  const { rows } = await getPool().query(query);
  return rows;
};

const findLoginForAuth = async ({ userName, employeeId }) => {
  const values = [];
  const conditions = [];

  if (userName) {
    values.push(userName);
    conditions.push(`user_name = $${values.length}`);
  }

  if (employeeId) {
    values.push(employeeId);
    conditions.push(`employee_id = $${values.length}`);
  }

  if (!conditions.length) {
    return null;
  }

  const query = `
    SELECT
      id,
      create_at,
      user_name,
      password,
      role,
      user_id,
      email,
      number,
      department,
      give_by,
      status,
      user_acess,
      employee_id,
      createdate,
      updatedate
    FROM login
    WHERE ${conditions.join(' OR ')}
    LIMIT 1
  `;

  const { rows } = await getPool().query(query, values);
  return rows[0] || null;
};

const findLoginById = async (id) => {
  const query = `
    SELECT
      id,
      create_at,
      user_name,
      role,
      user_id,
      email,
      number,
      department,
      give_by,
      status,
      user_acess,
      employee_id,
      createdate,
      updatedate
    FROM login
    WHERE id = $1
    LIMIT 1
  `;

  const { rows } = await getPool().query(query, [id]);
  return rows[0] || null;
};

const updateLogin = async (id, updates) => {
  const allowedFields = [
    'user_name',
    'password',
    'role',
    'user_id',
    'email',
    'number',
    'department',
    'give_by',
    'status',
    'user_acess',
    'employee_id'
  ];

  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(updates, field) &&
      updates[field] !== undefined
    ) {
      values.push(updates[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (!setClauses.length) {
    return findLoginById(id);
  }

  const query = `
    UPDATE login
    SET ${setClauses.join(', ')}, updatedate = NOW()
    WHERE id = $${values.length + 1}
    RETURNING
      id,
      create_at,
      user_name,
      role,
      user_id,
      email,
      number,
      department,
      give_by,
      status,
      user_acess,
      employee_id,
      createdate,
      updatedate
  `;

  values.push(id);

  const { rows } = await getPool().query(query, values);
  return rows[0] || null;
};

const deleteLogin = async (id) => {
  const query = 'DELETE FROM login WHERE id = $1 RETURNING id';
  const { rows } = await getPool().query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  insertLogin,
  findAllLogins,
  findLoginForAuth,
  findLoginById,
  updateLogin,
  deleteLogin
};

const { getAuthPool } = require('../config/database');

// Expects an existing table `public.users` with columns:
// id (pk), user_name, employee_id, password or password_hash, role, created_at, user_status, email_id, etc.
const findByLogin = async ({ userName, employeeId }) => {
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
    SELECT *
    FROM public.users
    WHERE ${conditions.join(' OR ')}
    LIMIT 1
  `;
  const { rows } = await getAuthPool().query(query, values);
  return rows[0] ?? null;
};

module.exports = { findByLogin };

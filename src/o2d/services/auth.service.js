const { pgQuery, getPgPool } = require("../../../config/pg.js");

const DEFAULT_PERMISSIONS = {
  read: true,
  write: false,
  update: false,
  delete: false,
};

function parsePermissions(row) {
  if (!row) return row;

  const raw = row.user_permissions;

  if (raw === null || raw === undefined) {
    row.user_permissions = DEFAULT_PERMISSIONS;
    row.permissions = row.user_permissions;
    return row;
  }

  if (typeof raw === "string") {
    try {
      row.user_permissions = JSON.parse(raw);
    } catch (err) {
      row.user_permissions = DEFAULT_PERMISSIONS;
    }
  } else if (typeof raw === "object") {
    row.user_permissions = raw;
  }

  row.permissions = row.user_permissions;

  return row;
}

async function findUserByUsername(username) {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at
     FROM users
     WHERE username = $1`,
    [username]
  );
  return parsePermissions(result.rows[0]) || null;
}

async function registerUser({
  username,
  password,
  access = null,
  supervisor_name = null,
  item_name = null,
  quality_controller = null,
  role = null,
  loading_incharge = null,
  permissions = DEFAULT_PERMISSIONS,
}) {
  const existing = await findUserByUsername(username);
  if (existing) {
    const err = new Error("Username already exists");
    err.status = 409;
    throw err;
  }

  const storedPermissions =
    typeof permissions === "string"
      ? permissions
      : JSON.stringify(permissions || DEFAULT_PERMISSIONS);

  const result = await pgQuery(
    `INSERT INTO users
      (username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, username, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at`,
    [username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, storedPermissions]
  );

  return parsePermissions(result.rows[0]);
}

async function listUsers() {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at
     FROM users
     ORDER BY created_at ASC, id ASC`
  );
  return result.rows.map(parsePermissions);
}

async function findUserById(id) {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return parsePermissions(result.rows[0]) || null;
}

async function updateUser(id, updates) {
  const {
    username,
    password,
    access,
    supervisor_name,
    item_name,
    quality_controller,
    role,
    loading_incharge,
    permissions,
  } = updates;

  // Build dynamic update set
  const fields = [];
  const values = [];
  let idx = 1;

  const push = (field, value) => {
    fields.push(`${field} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (username !== undefined) push("username", username);
  if (password !== undefined) push("password", password);
  if (access !== undefined) push("access", access);
  if (supervisor_name !== undefined) push("supervisor_name", supervisor_name);
  if (item_name !== undefined) push("item_name", item_name);
  if (quality_controller !== undefined) push("quality_controller", quality_controller);
  if (role !== undefined) push("role", role);
  if (loading_incharge !== undefined) push("loading_incharge", loading_incharge);
  if (permissions !== undefined) {
    const storedPermissions =
      typeof permissions === "string"
        ? permissions
        : JSON.stringify(permissions || DEFAULT_PERMISSIONS);
    push("user_permissions", storedPermissions);
  }

  if (!fields.length) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  const query = `
    UPDATE users
    SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at
  `;

  values.push(id);
  const result = await pgQuery(query, values);
  return parsePermissions(result.rows[0]) || null;
}

async function deleteUser(id) {
  const result = await pgQuery(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
}

async function bulkUpdateUserPermissions(userPermissions = []) {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
    const err = new Error("users array is required");
    err.status = 400;
    throw err;
  }

  const normalize = (value = {}) => ({
    read: value.read !== undefined ? Boolean(value.read) : true,
    write: value.write !== undefined ? Boolean(value.write) : false,
    update: value.update !== undefined ? Boolean(value.update) : false,
    delete: value.delete !== undefined ? Boolean(value.delete) : false,
  });

  const client = await getPgPool().connect();

  try {
    await client.query("BEGIN");
    const updated = [];

    for (const entry of userPermissions) {
      const { id, permissions } = entry || {};
      if (!id) {
        const err = new Error("Each user entry requires an id");
        err.status = 400;
        throw err;
      }

      const nextPermissions = normalize(permissions);
      const serialized = JSON.stringify(nextPermissions);
      const result = await client.query(
        `UPDATE users
           SET user_permissions = $1,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, username, access, supervisor_name, item_name, quality_controller, role, loading_incharge, user_permissions, created_at, updated_at`,
        [serialized, id]
      );

      if (!result.rows[0]) {
        const err = new Error(`User not found for id ${id}`);
        err.status = 404;
        throw err;
      }

      updated.push(parsePermissions(result.rows[0]));
    }

    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// All user CRUD service functions removed from exports
// Use shared authentication from /api/auth/login instead
module.exports = {
  // All user CRUD functions removed - use shared authentication
};

const { getPgPool } = require("../../../config/pg.js");

/**
 * Lead-to-order services expect a default exported `pool`.
 * Always get a fresh pool reference to avoid using ended pools.
 * This wrapper ensures we never use an ended pool.
 */
function getValidPool() {
  let p = getPgPool();
  // If pool is ended, getPgPool should recreate it, but double-check
  if (p && (p._ending || p._ended)) {
    // Force recreation by resetting and getting new pool
    p = getPgPool();
  }
  return p;
}

const pool = {
  query: async function(text, params) {
    const p = getValidPool();
    return p.query(text, params);
  },
  connect: async function() {
    const p = getValidPool();
    return p.connect();
  },
  end: function() {
    // Don't allow ending the pool through this wrapper
    // The pool should only be ended by the main pg.js module
    const p = getValidPool();
    return p.end ? p.end() : Promise.resolve();
  }
};

// Proxy to forward all other properties/methods
module.exports = new Proxy(pool, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    const p = getValidPool();
    const value = p[prop];
    if (typeof value === 'function') {
      return value.bind(p);
    }
    return value;
  }
});

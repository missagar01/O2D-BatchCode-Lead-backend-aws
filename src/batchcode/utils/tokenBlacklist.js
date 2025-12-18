// Simple in-memory token blacklist with expiry pruning.
// This is process-local and clears on server restart.
const blacklist = new Map(); // token -> expiresAt (ms)

const purgeExpired = () => {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist.entries()) {
    if (expiresAt <= now) {
      blacklist.delete(token);
    }
  }
};

const blacklistToken = (token, expSeconds) => {
  if (!token) return;
  const now = Date.now();
  const expiresAt = expSeconds ? expSeconds * 1000 : now;
  blacklist.set(token, expiresAt);
  purgeExpired();
};

const isBlacklisted = (token) => {
  if (!token) return false;
  purgeExpired();
  const expiresAt = blacklist.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
};

module.exports = { blacklistToken, isBlacklisted };

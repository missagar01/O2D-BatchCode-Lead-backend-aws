// All user CRUD operations removed - use shared /api/auth/login for authentication
// Only logout kept for symmetry

// Stateless logout: client should discard token; provided for symmetry
async function handleLogout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out (client should discard token)",
  });
}

module.exports = {
  // All user CRUD handlers removed - use shared authentication
  handleLogout,
};

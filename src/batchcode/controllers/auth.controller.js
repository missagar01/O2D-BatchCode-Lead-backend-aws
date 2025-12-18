const { StatusCodes } = require('http-status-codes');
const authService = require('../services/auth.service');
const { buildResponse } = require('../utils/apiResponse');
const tokenBlacklist = require('../utils/tokenBlacklist');

// Login removed - use /api/auth/login instead

const listRegistrations = async (req, res) => {
  const users = await authService.listRegistrations();
  res.status(StatusCodes.OK).json(buildResponse('Users fetched', users));
};

const register = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(StatusCodes.CREATED).json(buildResponse('User registered', user));
};

const getRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const user = await authService.getRegistration(id);
  res.status(StatusCodes.OK).json(buildResponse('User fetched', user));
};

const updateRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const user = await authService.updateRegistration(id, req.body);
  res.status(StatusCodes.OK).json(buildResponse('User updated', user));
};

const deleteRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await authService.deleteRegistration(id);
  res.status(StatusCodes.OK).json(buildResponse('User deleted', deleted));
};

const logout = async (req, res) => {
  // requireAuth adds req.token and req.user
  const token = req.token;
  const exp = req.user?.exp;
  tokenBlacklist.blacklistToken(token, exp);
  res.status(StatusCodes.OK).json(buildResponse('Logout successful'));
};

module.exports = {
  // login removed - use /api/auth/login instead
  logout,
  register,
  listRegistrations,
  getRegistration,
  updateRegistration,
  deleteRegistration
};

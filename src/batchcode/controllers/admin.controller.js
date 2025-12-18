const { StatusCodes } = require('http-status-codes');
const adminService = require('../services/admin.service');
const { buildResponse } = require('../utils/apiResponse');

const normalizeStringParam = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const getAdminOverview = async (req, res) => {
  const uniqueCode =
    normalizeStringParam(req.params.unique_code) ?? normalizeStringParam(req.query.unique_code);

  const { tables, counts, appliedFilters } = await adminService.getAdminTablesSnapshot({ uniqueCode });

  res
    .status(StatusCodes.OK)
    .json(buildResponse('Admin data fetched', tables, { counts, filters: appliedFilters }));
};

module.exports = { getAdminOverview };

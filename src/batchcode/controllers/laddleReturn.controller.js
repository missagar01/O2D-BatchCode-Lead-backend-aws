const { StatusCodes } = require('http-status-codes');
const laddleReturnService = require('../services/laddleReturn.service');
const { buildResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const parseIntegerParam = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be an integer`);
  }
  return parsed;
};

const normalizeStringParam = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const createEntry = async (req, res) => {
  const payload = await laddleReturnService.createLaddleReturn(req.body);
  res.status(StatusCodes.CREATED).json(buildResponse('Laddle return entry recorded', payload));
};

const listEntries = async (req, res) => {
  const id = parseIntegerParam(req.query.id, 'id');
  const uniqueCode = normalizeStringParam(req.query.unique_code);

  const entries = await laddleReturnService.listLaddleReturns({ id, uniqueCode });
  res.status(StatusCodes.OK).json(buildResponse('Laddle return entries fetched', entries));
};

const getEntryByUniqueCode = async (req, res) => {
  const uniqueCode = normalizeStringParam(req.params.unique_code);
  if (!uniqueCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'unique_code path parameter is required');
  }

  const entry = await laddleReturnService.getLaddleReturnByUniqueCode(uniqueCode);
  if (!entry) {
    throw new ApiError(StatusCodes.NOT_FOUND, `No Laddle return entry found for code ${uniqueCode}`);
  }

  res.status(StatusCodes.OK).json(buildResponse('Laddle return entry fetched', entry));
};

module.exports = { createEntry, listEntries, getEntryByUniqueCode };

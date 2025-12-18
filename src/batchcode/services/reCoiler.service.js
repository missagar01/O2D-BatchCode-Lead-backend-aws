const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/apiError');
const hotCoilRepository = require('../repositories/hotCoil.repository');
const reCoilerRepository = require('../repositories/reCoiler.repository');

const MACHINE_LETTERS = {
  SRMPL01: 'A',
  SRMPL02: 'B',
  SRMPL03: 'C',
  SRMPL04: 'D',
  SRMPL05: 'E',
  SRMPL06: 'F',
  SRMPL07: 'G',
  SRMPL08: 'H',
  SRMPL09: 'I'
};

const mapMachineLetter = (machineNumberRaw) => {
  if (!machineNumberRaw) return null;
  const key = String(machineNumberRaw).trim().toUpperCase();
  return MACHINE_LETTERS[key] ?? null;
};

const normalizeMachines = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((v) => (v ? String(v).trim().toUpperCase() : null)).filter(Boolean);
};

// Accept single string or array for text fields and store as a comma-separated string.
const normalizeTextList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
};

const createReCoiler = async (payload) => {
  const machines = normalizeMachines(payload.machine_number);
  const { hot_coiler_short_code } = payload;

  if (!hot_coiler_short_code) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'hot_coiler_short_code is required');
  }

  // Ensure the hot coil entry exists for this short code.
  const hotCoilRows = await hotCoilRepository.findHotCoilEntries({
    smsShortCode: hot_coiler_short_code
  });
  if (!hotCoilRows.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `hot_coiler_short_code ${hot_coiler_short_code} not found in hot_coil`
    );
  }

  if (!machines.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'machine_number is required and must include one or more of SRMPL01–SRMPL09'
    );
  }

  // Build entries for each machine; collect results.
  const results = [];

  // Unique code pattern: <hot_coiler_short_code><MachineLetter> (e.g., 2401A)
  for (const machine of machines) {
    const machineLetter = mapMachineLetter(machine);
    if (!machineLetter) {
      results.push({
        machine_number: machine,
        error: `machine_number ${machine} is invalid (expected SRMPL01–SRMPL09)`
      });
      continue;
    }

    const unique_code = `${hot_coiler_short_code}${machineLetter}`;

    const record = await reCoilerRepository.insertReCoiler({
      ...payload,
      machine_number: machine,
      hot_coiler_short_code,
      supervisor: normalizeTextList(payload.supervisor),
      contractor: normalizeTextList(payload.contractor),
      unique_code
    });
    results.push(record);
  }

  return results.length === 1 ? results[0] : results;
};

const listReCoilerEntries = async (filters = {}) => reCoilerRepository.findReCoilerEntries(filters);

const getReCoilerByUniqueCode = async (uniqueCode) => {
  const [entry] = await reCoilerRepository.findReCoilerEntries({ uniqueCode });
  return entry ?? null;
};

module.exports = { createReCoiler, listReCoilerEntries, getReCoilerByUniqueCode };

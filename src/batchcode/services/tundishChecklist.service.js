const crypto = require('crypto');
const tundishChecklistRepository = require('../repositories/tundishChecklist.repository');

const CODE_PREFIX = 'T-';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
const SEGMENT_LENGTH = 4;
const MAX_GENERATION_ATTEMPTS = 7;

const generateUniqueCode = () => {
  const bytes = crypto.randomBytes(SEGMENT_LENGTH);
  let segment = '';
  for (let index = 0; index < SEGMENT_LENGTH; index += 1) {
    segment += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return `${CODE_PREFIX}${segment}`;
};

const createTundishChecklist = async (payload) => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const unique_code = generateUniqueCode();
    try {
      return await tundishChecklistRepository.insertTundishChecklist({ ...payload, unique_code });
    } catch (error) {
      if (error?.code === '23505') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a unique Tundish Checklist code after multiple attempts');
};

const listTundishChecklists = async (filters = {}) =>
  tundishChecklistRepository.findTundishChecklists(filters);

const getTundishChecklistByUniqueCode = async (uniqueCode) => {
  const [entry] = await tundishChecklistRepository.findTundishChecklists({ uniqueCode });
  return entry ?? null;
};

module.exports = { createTundishChecklist, listTundishChecklists, getTundishChecklistByUniqueCode };

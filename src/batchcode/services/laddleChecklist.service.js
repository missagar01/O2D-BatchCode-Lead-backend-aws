const crypto = require('crypto');
const laddleChecklistRepository = require('../repositories/laddleChecklist.repository');

const CODE_PREFIX = 'C-';
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

const createLaddleChecklist = async (payload) => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const unique_code = generateUniqueCode();
    try {
      return await laddleChecklistRepository.insertLaddleChecklist({ ...payload, unique_code });
    } catch (error) {
      if (error?.code === '23505') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a unique Laddle Checklist code after multiple attempts');
};

const listLaddleChecklists = async (filters = {}) => laddleChecklistRepository.findLaddleChecklists(filters);

const getLaddleChecklistByUniqueCode = async (uniqueCode) => {
  const [entry] = await laddleChecklistRepository.findLaddleChecklists({ uniqueCode });
  return entry ?? null;
};

module.exports = { createLaddleChecklist, listLaddleChecklists, getLaddleChecklistByUniqueCode };

const crypto = require('crypto');
const laddleReturnRepository = require('../repositories/laddleReturn.repository');

const CODE_PREFIX = 'L-';
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

const createLaddleReturn = async (payload) => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const unique_code = generateUniqueCode();
    try {
      return await laddleReturnRepository.insertLaddleReturn({ ...payload, unique_code });
    } catch (error) {
      if (error?.code === '23505') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a unique Laddle Return code after multiple attempts');
};

const listLaddleReturns = async (filters = {}) => laddleReturnRepository.findLaddleReturns(filters);

const getLaddleReturnByUniqueCode = async (uniqueCode) => {
  const [entry] = await laddleReturnRepository.findLaddleReturns({ uniqueCode });
  return entry ?? null;
};

module.exports = { createLaddleReturn, listLaddleReturns, getLaddleReturnByUniqueCode };

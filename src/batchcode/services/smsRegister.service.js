const smsRegisterRepository = require('../repositories/smsRegister.repository');

const MAX_GENERATION_ATTEMPTS = 5;

const toDateOrNow = (value) => {
  const dateCandidate = value ? new Date(value) : new Date();
  return Number.isNaN(dateCandidate.getTime()) ? new Date() : dateCandidate;
};

const formatDay = (dateObj) => String(dateObj.getDate()).padStart(2, '0');
const formatSequence = (num) => String(num).padStart(2, '0');

const createSmsRegister = async (payload) => {
  const targetDate = toDateOrNow(payload?.sample_timestamp);
  const targetDateISO = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const currentCount = await smsRegisterRepository.countByDate(targetDateISO);
    const nextSequence = currentCount + 1;
    const unique_code = `${formatDay(targetDate)}${formatSequence(nextSequence)}`;

    try {
      return await smsRegisterRepository.insertSmsRegister({
        ...payload,
        unique_code
      });
    } catch (error) {
      // Unique constraint violation => retry with next sequence number
      if (error?.code === '23505') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a daily unique SMS register code after multiple attempts');
};

const listSmsRegisters = async (filters = {}) => smsRegisterRepository.findSmsRegisters(filters);

module.exports = { createSmsRegister, listSmsRegisters };

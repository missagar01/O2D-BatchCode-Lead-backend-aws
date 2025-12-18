const { z } = require('zod');

const timestampField = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return new Date();
    }
    if (value instanceof Date) {
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date;
  }, z.date({ invalid_type_error: 'sample_timestamp must be a valid date' }))
  .transform((value) => value.toISOString());

const trimmedString = (field, max = 255) =>
  z
    .string()
    .min(1, `${field} is required`)
    .max(max)
    .transform((value) => value.trim());

const createTundishChecklistSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    tundish_number: z
      .union([z.number(), z.string()])
      .refine((value) => {
        if (value === '' || value === null || value === undefined) {
          return false;
        }
        const numericValue = typeof value === 'number' ? value : Number(value);
        return Number.isInteger(numericValue);
      }, 'tundish_number must be an integer')
      .transform((value) => (typeof value === 'number' ? value : Number(value))),
    nozzle_plate_check: trimmedString('nozzle_plate_check'),
    well_block_check: trimmedString('well_block_check'),
    board_proper_set: trimmedString('board_proper_set'),
    board_sand_filling: trimmedString('board_sand_filling'),
    refractory_slag_cleaning: trimmedString('refractory_slag_cleaning'),
    tundish_mession_name: trimmedString('tundish_mession_name'),
    handover_proper_check: trimmedString('handover_proper_check'),
    handover_nozzle_installed: trimmedString('handover_nozzle_installed'),
    handover_masala_inserted: trimmedString('handover_masala_inserted'),
    stand1_mould_operator: trimmedString('stand1_mould_operator'),
    stand2_mould_operator: trimmedString('stand2_mould_operator'),
    timber_man_name: trimmedString('timber_man_name'),
    laddle_operator_name: trimmedString('laddle_operator_name'),
    shift_incharge_name: trimmedString('shift_incharge_name'),
    forman_name: trimmedString('forman_name')
  })
};

module.exports = { createTundishChecklistSchema };

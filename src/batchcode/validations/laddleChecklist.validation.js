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

const parseDateInput = (value) => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? value : date;
};

const dateOnlyField = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return value;
    }
    return parseDateInput(value);
  }, z.date({ invalid_type_error: 'sample_date must be a valid date' }))
  .transform((value) => value.toISOString().split('T')[0]);

const optionalTrimmedString = (field, max = 255) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, `${field} must be at most ${max} characters`);

const createLaddleChecklistSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    laddle_number: z
      .union([z.number(), z.string()])
      .refine((value) => {
        if (value === '' || value === null || value === undefined) {
          return false;
        }
        const numericValue = typeof value === 'number' ? value : Number(value);
        return Number.isInteger(numericValue);
      }, 'laddle_number must be an integer')
      .transform((value) => (typeof value === 'number' ? value : Number(value))),
    sample_date: dateOnlyField,
    slag_cleaning_top: optionalTrimmedString('slag_cleaning_top', 50),
    slag_cleaning_bottom: optionalTrimmedString('slag_cleaning_bottom', 50),
    nozzle_proper_lancing: optionalTrimmedString('nozzle_proper_lancing', 50),
    pursing_plug_cleaning: optionalTrimmedString('pursing_plug_cleaning', 50),
    sly_gate_check: optionalTrimmedString('sly_gate_check', 50),
    nozzle_check_cleaning: optionalTrimmedString('nozzle_check_cleaning', 50),
    sly_gate_operate: optionalTrimmedString('sly_gate_operate', 50),
    nfc_proper_heat: optionalTrimmedString('nfc_proper_heat', 50),
    nfc_filling_nozzle: optionalTrimmedString('nfc_filling_nozzle', 50),
    plate_life: z
      .union([z.number(), z.string()])
      .optional()
      .refine((value) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        const numericValue = typeof value === 'number' ? value : Number(value);
        return Number.isInteger(numericValue);
      }, 'plate_life must be an integer')
      .transform((value) => {
        if (value === undefined || value === null || value === '') {
          return null;
        }
        return typeof value === 'number' ? value : Number(value);
      }),
    timber_man_name: optionalTrimmedString('timber_man_name', 100),
    laddle_man_name: optionalTrimmedString('laddle_man_name', 100),
    laddle_foreman_name: optionalTrimmedString('laddle_foreman_name', 100),
    supervisor_name: optionalTrimmedString('supervisor_name', 100)
  })
};

module.exports = { createLaddleChecklistSchema };

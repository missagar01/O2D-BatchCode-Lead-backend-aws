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
  }, z.date({ invalid_type_error: 'laddle_return_date must be a valid date' }))
  .transform((value) => value.toISOString().split('T')[0]);

const trimmedString = (field, max = 255) =>
  z
    .string()
    .min(1, `${field} is required`)
    .max(max)
    .transform((value) => value.trim());

const optionalString = (field, max = 255) =>
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

const timeField = z
  .string()
  .min(1, 'laddle_return_time is required')
  .transform((value) => value.trim())
  .transform((value) => {
    const ampmMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (ampmMatch) {
      let [, hours, minutes, seconds, period] = ampmMatch;
      let h = Number(hours);
      const m = Number(minutes);
      const s = Number(seconds ?? '0');
      if (h === 12) {
        h = period.toUpperCase() === 'AM' ? 0 : 12;
      } else if (period.toUpperCase() === 'PM') {
        h += 12;
      }
      return { h, m, s };
    }
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) {
      throw new Error('laddle_return_time must be HH:MM or HH:MM:SS');
    }
    const [, hours, minutes, seconds] = match;
    return { h: Number(hours), m: Number(minutes), s: Number(seconds ?? '0') };
  })
  .transform(({ h, m, s }) => {
    if (h > 23 || m > 59 || s > 59) {
      throw new Error('laddle_return_time must be a valid time');
    }
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  });

const createLaddleReturnSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    laddle_return_date: dateOnlyField,
    laddle_return_time: timeField,
    poring_temperature: optionalString('poring_temperature', 100),
    poring_temperature_photo: optionalString('poring_temperature_photo', 2048),
    furnace_shift_incharge: optionalString('furnace_shift_incharge', 100),
    furnace_crane_driver: optionalString('furnace_crane_driver', 100),
    ccm_temperature_before_pursing: optionalString('ccm_temperature_before_pursing', 100),
    ccm_temp_before_pursing_photo: optionalString('ccm_temp_before_pursing_photo', 2048),
    ccm_temp_after_pursing_photo: optionalString('ccm_temp_after_pursing_photo', 2048),
    ccm_crane_driver: optionalString('ccm_crane_driver', 100),
    stand1_mould_operator: optionalString('stand1_mould_operator', 100),
    stand2_mould_operator: optionalString('stand2_mould_operator', 100),
    shift_incharge: optionalString('shift_incharge', 100),
    timber_man: optionalString('timber_man', 100),
    operation_incharge: optionalString('operation_incharge', 100),
    laddle_return_reason: optionalString('laddle_return_reason', 2000)
  })
};

module.exports = { createLaddleReturnSchema };

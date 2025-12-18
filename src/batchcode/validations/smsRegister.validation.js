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

const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const temperatureField = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .refine(
    (value) => value === null || value.length <= 50,
    'temperature must be 50 characters or fewer'
  );

const createSmsRegisterSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    sequence_number: z.string().min(1, 'sequence_number is required').max(10),
    laddle_number: z
      .union([z.number(), z.string()])
      .optional()
      .refine((value) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        const numericValue = typeof value === 'number' ? value : Number(value);
        return Number.isInteger(numericValue);
      }, 'laddle_number must be an integer')
      .transform((value) => {
        if (value === undefined || value === null || value === '') {
          return null;
        }
        return typeof value === 'number' ? value : Number(value);
      }),
    sms_head: z.string().min(1, 'sms_head is required').max(150),
    furnace_number: z.string().min(1, 'furnace_number is required').max(50),
    remarks: optionalString,
    picture: optionalString,
    shift_incharge: z.string().min(1, 'shift_incharge is required').max(100),
    temperature: temperatureField
  })
};

module.exports = { createSmsRegisterSchema };

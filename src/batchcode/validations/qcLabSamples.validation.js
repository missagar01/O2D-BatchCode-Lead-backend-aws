const { z } = require('zod');

const decimalField = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .refine((value) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numericValue);
  }, 'Value must be numeric')
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return typeof value === 'number' ? value : Number(value);
  });

const nullableString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const timestampField = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed;
  }, z.date({ invalid_type_error: 'sample_timestamp must be a valid date' }).optional())
  .transform((value) => value?.toISOString());

const integerField = (fieldName) =>
  z
    .union([z.number(), z.string()])
    .refine((value) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      const numericValue = typeof value === 'number' ? value : Number(value);
      return Number.isInteger(numericValue);
    }, `${fieldName} must be an integer`)
    .transform((value) => (typeof value === 'number' ? value : Number(value)));

const createSampleSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    sms_batch_code: z.string().min(1, 'sms_batch_code is required').max(50),
    furnace_number: z.string().min(1, 'furnace_number is required').max(50),
    sequence_code: z.string().min(1, 'sequence_code is required').max(10),
    laddle_number: integerField('laddle_number'),
    shift_type: z.string().min(1, 'shift_type is required').max(20),
    final_c: decimalField,
    final_mn: decimalField,
    final_s: decimalField,
    final_p: decimalField,
    tested_by: z.string().min(1, 'tested_by is required').max(100),
    remarks: nullableString,
    report_picture: nullableString
  })
};

module.exports = { createSampleSchema };

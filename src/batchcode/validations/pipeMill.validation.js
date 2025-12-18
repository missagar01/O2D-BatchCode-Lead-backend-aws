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

const optionalStringField = (field, max = 255) =>
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

const createPipeMillSchema = {
  body: z.object({
    sample_timestamp: timestampField,
    recoiler_short_code: trimmedString('recoiler_short_code', 50),
    mill_number: trimmedString('mill_number', 100),
    section: optionalStringField('section', 50),
    item_type: optionalStringField('item_type', 50),
    quality_supervisor: trimmedString('quality_supervisor', 100),
    mill_incharge: trimmedString('mill_incharge', 100),
    forman_name: trimmedString('forman_name', 100),
    fitter_name: trimmedString('fitter_name', 100),
    shift: trimmedString('shift', 20),
    size: trimmedString('size', 50),
    thickness: optionalStringField('thickness', 30),
    remarks: optionalStringField('remarks', 1000),
    picture: optionalStringField('picture', 2048)
  })
};

module.exports = { createPipeMillSchema };

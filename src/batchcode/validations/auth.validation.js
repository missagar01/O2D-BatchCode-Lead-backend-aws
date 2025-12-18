const { z } = require('zod');

const usernameField = z
  .string()
  .min(1, 'user_name must be at least 1 character')
  .max(150);

const employeeIdField = z
  .string()
  .min(1, 'employee_id must be at least 1 character')
  .max(150);

const passwordField = z
  .string()
  .min(1, 'password is required')
  .max(200);

const usernameAliasField = z
  .string()
  .min(1, 'username must be at least 1 character')
  .max(150);

const roleField = z
  .string()
  .min(2, 'role must be at least 2 characters')
  .max(50)
  .optional()
  .transform((value) => value ?? 'user');

const roleUpdateField = z
  .string()
  .min(2, 'role must be at least 2 characters')
  .max(50)
  .optional();

const loginSchema = {
  body: z.object({
    user_name: usernameField.optional(),
    username: usernameAliasField.optional(),
    employee_id: employeeIdField.optional(),
    password: passwordField
  }).refine((data) => data.user_name || data.username || data.employee_id, {
    message: 'Either user_name, username, or employee_id is required',
    path: ['user_name']
  })
};

const registerSchema = {
  body: z.object({
    user_name: usernameField,
    password: passwordField,
    role: roleField,
    user_id: z.string().max(50).optional(),
    email: z.string().email().max(200).optional(),
    number: z.string().max(20).optional(),
    department: z.string().max(100).optional(),
    give_by: z.string().max(150).optional(),
    status: z.string().max(20).optional(),
    user_acess: z.string().max(200).optional(),
    employee_id: z.string().max(50).optional()
  })
};

const registerIdParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive()
  })
};

const registerUpdateSchema = {
  params: registerIdParamSchema.params,
  body: z
    .object({
      user_name: usernameField.optional(),
      password: passwordField.optional(),
      role: roleUpdateField,
      user_id: z.string().max(50).optional(),
      email: z.string().email().max(200).optional(),
      number: z.string().max(20).optional(),
      department: z.string().max(100).optional(),
      give_by: z.string().max(150).optional(),
      status: z.string().max(20).optional(),
      user_acess: z.string().max(200).optional(),
      employee_id: z.string().max(50).optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
      path: ['user_name']
    })
};

module.exports = { loginSchema, registerSchema, registerIdParamSchema, registerUpdateSchema };

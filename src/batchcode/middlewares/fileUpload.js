const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { logger } = require('../utils/logger');

const ensureDirectory = (targetPath) => {
  try {
    fs.mkdirSync(targetPath, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create upload directory at ${targetPath}`, error);
    throw error;
  }
};

const buildStorage = (resolveDestination) =>
  multer.diskStorage({
    destination: (_req, file, cb) => {
      const destinationDir = resolveDestination(file.fieldname);
      if (!destinationDir) {
        cb(new Error(`Unexpected upload field ${file.fieldname}`));
        return;
      }
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const randomSegment = Math.round(Math.random() * 1e9);
      const ext = (path.extname(file.originalname) || '.png').toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'file';
      cb(null, `${base}-${timestamp}-${randomSegment}${ext}`);
    }
  });

const defaultFileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image uploads are allowed for this field'));
    return;
  }
  cb(null, true);
};

const isMultipartRequest = (req) => (req.headers['content-type'] ?? '').toLowerCase().startsWith('multipart/form-data');

const normalizeFieldsConfig = (config) => {
  if (Array.isArray(config.fields) && config.fields.length > 0) {
    return config.fields;
  }
  if (config.fieldName && config.subDirectory) {
    return [{ fieldName: config.fieldName, subDirectory: config.subDirectory }];
  }
  throw new Error('fileUpload middleware requires either { fieldName, subDirectory } or fields[]');
};

const createFileUploadMiddleware = ({ fieldName, subDirectory, fields, limits, fileFilter = defaultFileFilter }) => {
  const normalizedFields = normalizeFieldsConfig({ fieldName, subDirectory, fields });
  const fieldMap = {};
  normalizedFields.forEach(({ fieldName: name, subDirectory: dir }) => {
    const destinationDir = path.join(process.cwd(), 'uploads', dir);
    ensureDirectory(destinationDir);
    fieldMap[name] = { destinationDir, subDirectory: dir };
  });

  const upload = multer({
    storage: buildStorage((field) => fieldMap[field]?.destinationDir),
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      ...limits
    }
  });

  const multerFieldsConfig = normalizedFields.map(({ fieldName: name }) => ({ name, maxCount: 1 }));

  return (req, res, next) => {
    if (!isMultipartRequest(req)) {
      next();
      return;
    }

    upload.fields(multerFieldsConfig)(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }

      req.body = req.body ?? {};
      normalizedFields.forEach(({ fieldName: name, subDirectory: dir }) => {
        const fileEntry = req.files?.[name]?.[0];
        if (fileEntry) {
          // Build full URL from request
          const protocol = req.protocol || 'http';
          const host = req.get('host') || 'localhost:3006';
          const baseUrl = process.env.BASE_URL || process.env.API_BASE_URL || `${protocol}://${host}`;
          const relativePath = `/uploads/${dir}/${fileEntry.filename}`;
          // Store as full URL
          req.body[name] = `${baseUrl}${relativePath}`;
        }
      });

      next();
    });
  };
};

module.exports = createFileUploadMiddleware;

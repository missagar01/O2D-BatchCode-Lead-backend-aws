const { StatusCodes } = require('http-status-codes');

const notFoundHandler = (_req, res, _next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Resource not found'
  });
};

module.exports = notFoundHandler;

const buildResponse = (message, data, meta) => ({
  success: true,
  message,
  data,
  meta
});

module.exports = { buildResponse };

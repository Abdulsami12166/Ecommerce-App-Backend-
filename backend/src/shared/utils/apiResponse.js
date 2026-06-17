const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const sendError = (res, statusCode, message, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });

/**
 * sendSuccessResponse(res, dataObj, message, statusCode)
 * Spreads dataObj keys at the top level so user-app screens can access
 * e.g. response.data.tickets, response.data.refund, etc.
 */
const sendSuccessResponse = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

/**
 * sendErrorResponse(res, message, statusCode)
 */
const sendErrorResponse = (res, message = 'Error', statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

module.exports = { sendSuccess, sendError, sendSuccessResponse, sendErrorResponse };

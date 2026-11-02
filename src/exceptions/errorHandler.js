// In your global errorHandler middleware file (e.g., middlewares/error.middleware.js)
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 1. Detect if the message string contains raw stringified Zod JSON data
  let parsedErrors = null;
  if (typeof err.message === 'string' && err.message.startsWith('[')) {
    try {
      parsedErrors = JSON.parse(err.message);
    } catch (e) {
      // Not a valid JSON string, fallback to standard string handling
    }
  }

  // 2. Respond to your React frontend with clean JSON format
  res.status(err.statusCode).json({
    status: err.status,
    message: parsedErrors ? "Validation failed" : err.message, 
    errors: parsedErrors || undefined 
  });
};

export default errorHandler;

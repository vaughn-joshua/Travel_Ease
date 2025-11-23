export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack
    })
  });
};
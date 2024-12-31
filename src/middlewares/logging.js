// Middleware de logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.url} [STARTED]`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} [FINISHED] ${res.statusCode} ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;

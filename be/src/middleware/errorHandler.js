module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const message = err.message || 'Lỗi máy chủ';
  console.error('[ERROR]', message, err.stack || '');
  res.status(status).json({ message });
};

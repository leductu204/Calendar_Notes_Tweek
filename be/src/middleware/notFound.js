module.exports = function notFound(req, res, next) {
  res.status(404).json({
    fromNode: true,                  // đóng dấu để biết có “đụng” đúng BE hay không
    path: req.originalUrl,
    method: req.method,
    message: 'Không tìm thấy tài nguyên.',
  });
};

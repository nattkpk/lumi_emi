function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ status: 'error', message: err.message });
  }

  if (err.code === 'P2002') { // Prisma unique constraint violation
    return res.status(409).json({ status: 'error', message: 'Resource already exists with this data' });
  }

  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}

module.exports = errorHandler;

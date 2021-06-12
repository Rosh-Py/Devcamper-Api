module.exports = asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next); //When next will be called then the errorHandler middleware will trigger
};

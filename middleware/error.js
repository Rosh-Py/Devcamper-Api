const ErrorResponse = require("../utils/errorResponse");

module.exports = errorHandler = (err, req, res, next) => {
  console.log(err.stack.red);

  //Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found`;
    err = new Error(message, 404);
  }

  //Mongoose duplicate value
  if (err.code === 11000) {
    // console.log(err);
    const message = `Duplicate field value entered for ${Object.keys(
      err.keyValue
    ).toString()}`;
    err = new Error(message, 400);
  }

  //Mongoose Validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    err = new ErrorResponse(message, 400);
  }
  res
    .status(err.statusCode || 500)
    .json({ success: false, error: err.message || "Server Error" });
};

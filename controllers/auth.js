const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse"); //Custom error class
const asyncHandler = require("../utils/asyncHandler"); //This util is used to call next() in case of error  in async functions
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  //create user
  const user = await User.create({ name, email, password, role });

  sendTokenResponse(user, 200, res);
  // res.status(201).json({ success: true, data: user });
});

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  //validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  //Check for user
  const user = await User.findOne({ email }).select("+password"); //+password is required, as select set to false in UserSchema

  if (!user) {
    console.log("user not found");
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  //check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

//get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

//@desc     Get current logged in user
//@route    GET /api/v1/auth/me
//@access   Private

exports.getMe = asyncHandler(async (req, res, next) => {
  //find user
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, data: user });
});

//@desc     Update user details
//@route    PUT /api/v1/auth/updatedetails
//@access   Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };
  //find user
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});

//@desc     Update user password
//@route    PUT /api/v1/auth/updatepassword
//@access   Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
  //find user
  const user = await User.findById(req.user.id).select("+password");
  //check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }
  user.password = req.body.newPassword;
  user.save();
  sendTokenResponse(user, 200, res);
});

//@desc     Forgot password
//@route    POST /api/v1/auth/forgotpassword
//@access   Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  //find user
  const user = await User.findOne({ email: req.body.email }, "password");

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  //Get reset token
  const resetToken = user.getResetPasswordToken();
  //save the user document
  user.save({ validateBeforeSave: false });

  //create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you have requested the reset for a password. Please make a put request to: \n\n ${resetUrl}`;

  //send reset password email
  try {
    await sendEmail({
      email: req.body.email,
      subject: "Password reset token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse("Email could not be sent", 500));
  }

  // res.status(200).json({ success: true, data: user });
});

//@desc     Reset Password
//@route    PUT /api/v1/auth/resetpassword/:resetToken
//@access   Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
  //Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("InvalidToken", 400));
  }
  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc     Logout / clear cookies
//@route    GET /api/v1/auth/logout
//@access   Private

exports.logout = asyncHandler(async (req, res, next) => {
  //find user
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
});

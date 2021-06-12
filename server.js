const express = require("express");
const path = require("path");
require("dotenv").config({ path: "./config/config.env" }); //loads env variables
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
// const logger = require("./middleware/logger");
const morgan = require("morgan");
const connectDB = require("./utils/db");
const errorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
require("colors");
const fileUpload = require("express-fileupload"); //for fileUpload
const mongoSanitize = require("express-mongo-sanitize"); //for sanitizing the received data
const helmet = require("helmet"); //for extra security in headers
const xss = require("xss-clean"); //for xss attack prevention
const rateLimit = require("express-rate-limit"); //for rate limiting
const hpp = require("hpp"); //for preventing http param pollution
const cors = require("cors");

//connect to database
connectDB();

const app = express();

//Body parser
app.use(express.json());

//cookie parser
app.use(cookieParser());

//Middleware logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// app.use(logger);

//fileUpload Middleware
app.use(fileUpload());

//set static path
app.use(express.static(path.join(__dirname, "public")));

//sanitize the data
app.use(mongoSanitize());

app.use(helmet()); //middleware for extra security in header
//Mount routers

app.use(xss()); //to prevent xss attacks

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min.
  max: 100,
});

app.use(limiter);

//prevent http param pollution
app.use(hpp());

app.use(cors());

app.use("/api/v1/bootcamps", bootcamps);

app.use("/api/v1/courses", courses);

app.use("/api/v1/auth", auth);

app.use(errorHandler); //call next in above middleware i.e.bootcamps route in case of error

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} on port ${PORT}`.yellow.bold
  )
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error ${err.message}`.red);
  //close server and exit
  server.close(() => process.exit(1));
});

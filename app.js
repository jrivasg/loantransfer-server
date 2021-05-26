const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
const cors = require("cors");
//const cookieParser = require("cookie-parser");

require("./helpers/init_mongodb");
const { verifyAccessToken } = require("./helpers/jwt_helper");
require("./helpers/init_redis");
//require("./helpers/generate_keys"); // Solo una vez para generar las claves para crear los tokens

const AuthRoute = require("./Routes/Auth.route");
const UserRoute = require("./Routes/User.route");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//app.use(cookieParser());

app.get("/", verifyAccessToken, async (req, res, next) => {
  res.send("Hello from express.");
});

app.use("/auth", AuthRoute);
app.use("/user", UserRoute);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: '*',
  },
});
require("./helpers/socket_io")(io);

const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
const cors = require("cors");
//const cookieParser = require("cookie-parser");

require("./helpers/init_mongodb");
const { verifyAccessToken } = require("./helpers/jwt_helper");
require("./helpers/init_redis");
//require("./helpers/generate_keys"); // Solo una vez para generar las claves para crear los tokens

 /* app.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:9000",
    "https://886fb727b703.ngrok.io",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin, withcredentials, Origin, Accept, Accept-Language, Accept-Version, Content-Length, Content-Language', Content-MD5, Content-Type, Credentials, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Authorization, X-Requested-With"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});  */

const AuthRoute = require("./Routes/Auth.route");
const UserRoute = require("./Routes/User.route");
const ChatRoute = require("./Routes/Chat.route");
const BidRoute = require("./Routes/Bid.route");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//app.use(cookieParser());

app.get(
  "/",
  /* verifyAccessToken, */ async (req, res, next) => {
    res.sendFile(__dirname + "/index.html");
    //res.send("Servidor de subastas corriendo");
  }
);

app.use("/auth", AuthRoute);
app.use("/user", UserRoute);
app.use("/chat", ChatRoute);
app.use("/bid", BidRoute);

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

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = io;
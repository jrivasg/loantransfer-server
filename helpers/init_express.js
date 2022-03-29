// Carga de librerias
require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");

// Configuración middlewares
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet());
app.use(cors());

// Configuración para MORGAN
const morgan = require("morgan");
const winston = require("./winston_config.js");
//morgan.token("user_id", (req) => JSON.stringify(req.headers.user_id));
app.use(
  morgan(process.env.LOG_FORMAT || "common", {
    skip: (req, res) => req.method === "OPTIONS",
    stream: winston.stream,
  })
);

// Importación de las rutas
const {
  AuthRoute,
  UserRoute,
  ChatRoute,
  BidRoute,
  OTProute,
  UploadRoute,
} = require("../Routes/index");

app.use("/auth", AuthRoute);
app.use("/user", UserRoute);
app.use("/chat", ChatRoute);
app.use("/bid", BidRoute);
app.use("/otp", OTProute);
app.use("/upload", UploadRoute);

// Configuración errores
const createError = require("http-errors");
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

module.exports = app;

// Carga de librerias
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";

// Inicialización de componentes/
import "./initialSetup.js";
import winston from "./winston_config.js";

// Configuración middleware
const app = express();
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(helmet());

// Configuración para MORGAN
//morgan.token("user_id", (req) => JSON.stringify(req.headers.user_id));
app.use(
  morgan(process.env.LOG_FORMAT || "common", {
    skip: (req, res) => req.method === "OPTIONS",
    stream: winston.stream,
  })
);

// Configuración para CORS
const cors = require("cors");

// Configuración Socket.io
const io = require("socket.io")(https, {
  cors: {
    orgin: "*",
  },
});
const { createClient } = require("redis");
const redisAdapter = require("@socket.io/redis-adapter");

const pubClient = createClient({ host: "redisloantransfer", port: 6379 });
const subClient = pubClient.duplicate();
io.adapter(redisAdapter(pubClient, subClient));

// Importamos los diferentes sockets
require("./Controllers/Socket/Chat.socket")(io);
require("./Controllers/Socket/Bid.socket")(io);
require("./Controllers/Socket/Notification.socket")(io);

// Importación de las rutas
const {
  AuthRoute,
  UserRoute,
  ChatRoute,
  BidRoute,
  OTProute,
  UploadRoute,
} = require("./Routes/index");

// Manejador de errores
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message || 'Internal server error',
    },
  });
});

export default app;

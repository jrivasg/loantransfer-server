require("dotenv").config();
const express = require("express");
const fs = require("fs");
const app = express();
/* const https = require("https").createServer(
  {
    key: fs.readFileSync("./privkeyloan.pem"),
    cert: fs.readFileSync("./fullchainloan.pem"),
  },
  app
); */
const https = require("http").createServer(app);
const logger = require("morgan");
const createError = require("http-errors");
const cors = require("cors");
//const cookieParser = require("cookie-parser");
require("./helpers/init_mongodb");
require("./helpers/init_redis");

// Prueba programar email
//require("./helpers/sendEmail").pruebasSchedule();
//require("./helpers/scheduler").reschedulePendingJobs();

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

/* const lote = async () => {
  const Bid = require("./Models/bid.model");
  const subbid = await Bid.find(
    {
      _id: "623254c8be88d20033d863a1",
      "bids._id": "623254c8be88d20033d863a2",
    },
    { "bids.$": 1 }
  );
  console.log("lote", subbid[0].bids[0]);
};

lote(); */

// Importación de las rutas
const {
  AuthRoute,
  UserRoute,
  ChatRoute,
  BidRoute,
  OTProute,
  UploadRoute,
} = require("./Routes/index");
//require("./helpers/generate_keys"); // Solo una vez para generar las claves para crear los tokens

app.use(logger("common"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname + "/public"));
//app.use(cookieParser());

app.get(
  "/",
  /* verifyAccessToken, */ async (req, res, next) => {
    //res.sendFile(__dirname + "/index.html");
    res.send("Servidor de subastas corriendo");
  }
);

app.use("/auth", AuthRoute);
app.use("/user", UserRoute);
app.use("/chat", ChatRoute);
app.use("/bid", BidRoute);
app.use("/otp", OTProute);
app.use("/upload", UploadRoute);

// Configuración errores
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

https.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = io;

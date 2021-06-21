const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

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

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//app.use(cookieParser());

// Configuración de socket.io
io.on("connection", (socket) => {
  socket.on("login", ({ name, room }, callback) => {
    const { user, error } = addUser(socket.id, name, room);
    if (error) return callback(error);
    socket.join(user.room);
    socket.in(room).emit("notification", {
      title: "Someone's here",
      description: `${user.name} just entered the room`,
    });
    io.in(room).emit("users", getUsers(room));
    callback();
  });

  socket.on("sendMessage", (message) => {
    const user = getUser(socket.id);
    io.in(user.room).emit("message", { user: user.name, text: message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    const user = deleteUser(socket.id);
    if (user) {
      io.in(user.room).emit("notification", {
        title: "Someone just left",
        description: `${user.name} just left the room`,
      });
      io.in(user.room).emit("users", getUsers(user.room));
    }
  });
});

app.get(
  "/",
  /* verifyAccessToken, */ async (req, res, next) => {
    res.send("Servidor de subastas corriendo");
  }
);

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

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

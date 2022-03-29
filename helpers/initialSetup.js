// require("./helpers/generate_keys"); // Solo una vez para generar las claves para crear los tokens

// Inicialización de bases de datos
require("./init_redis.js");
require("./init_mongodb.js");

// Reprogramamos el envío de email previo a subasta en cada reinicio del servidor
process.env.NODE_ENV === "production" &&
  require("./helpers/scheduler").reschedulePendingJobs();

// Inicializamos Express
const app = require("./init_express");

module.exports = app;

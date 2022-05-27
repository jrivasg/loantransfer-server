const { createClient } = require("redis");
const redisAdapter = require("@socket.io/redis-adapter");

module.exports = (server) => {
  // Configuración Socket.io
  const io = require("socket.io")(server, {
    cors: {
      orgin: "*",
    },
  });

  const pubClient = createClient({ host: "redisdb-nplloan", port: 6379 });
  const subClient = pubClient.duplicate();
  io.adapter(redisAdapter(pubClient, subClient));

  require("../Controllers/Socket/Chat.socket")(io);
  require("../Controllers/Socket/Bid.socket")(io);
  require("../Controllers/Socket/Notification.socket")(io);
};

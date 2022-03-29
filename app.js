require("dotenv").config();
const fs = require("fs");
const app = require("./helpers/initialSetup");

const server =
  process.env.NODE_ENV === "production"
    ? require("https").createServer(
        {
          key: fs.readFileSync("./certs/privkeyapploan.pem"),
          cert: fs.readFileSync("./certs/fullchainapploan.pem"),
        },
        app
      )
    : require("http").createServer(app);

// Configuración Socket.io
require("./helpers/init_socketio")(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

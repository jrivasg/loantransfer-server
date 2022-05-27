require("dotenv").config();
const fs = require("fs");
const app = require("./helpers/initialSetup");

const server = require("http").createServer(app);
  /* process.env.NODE_ENV === "production"
    ? require("https").createServer(
        {
          key: fs.readFileSync("./certs/live/app.loan-transfer.com/privkey.pem"),
          cert: fs.readFileSync("./certs/live/app.loan-transfer.com/fullchain.pem"),
        },
        app
      )
    : require("http").createServer(app); */

// Configuración Socket.io
require("./helpers/init_socketio")(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

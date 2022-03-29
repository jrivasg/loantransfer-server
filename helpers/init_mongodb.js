require("dotenv").config();
const mongoose = require("mongoose");

if (process.env.NODE_ENV === "development") {
  const tunnel = require("tunnel-ssh");
  const ssh_config = {
    username: process.env.SSH_USER,
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || "22",
    dstHost: process.env.REMOTE_HOST,
    dstPort: process.env.MONGO_REMOTE_PORT,
    localHost: process.env.LOCALHOST,
    localPort: process.env.MONGO_LOCAL_PORT,
    privateKey: require("fs").readFileSync(process.env.CERT_PATH),
  };

  tunnel(ssh_config, function (error, server) {
    if (error) console.log(error);
    mongoose.connect(process.env.MONGODB_DEV, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
  });
}

process.env.NODE_ENV === "production" &&
  mongoose
    .connect(process.env.MONGODB_PRO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .catch((err) => console.log(err.message));

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to db");
});

mongoose.connection.on("error", (err) => {
  console.log(err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection is disconnected.");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

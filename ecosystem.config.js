module.exports = {
  apps: [
    {
      script: "app.js",
      watch: ["Controllers", "assets", "helpers", "Models", "public", "Routes", "Templates", ],
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: ["node_modules", "uploads"],
    },
  ],
};

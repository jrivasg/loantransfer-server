module.exports = {
  apps: [
    {
      script: "app.js",
      watch: false,
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: ["node_modules", "uploads", '.git'],
    },
  ],
};

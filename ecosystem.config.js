module.exports = {
  apps: [
    {
      script: "app.js",
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: ["node_modules", "uploads", ".git"],
      env_development: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

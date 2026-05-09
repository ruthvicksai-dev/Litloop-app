const appJson = require("./app.json");

const config = appJson.expo;

module.exports = {
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ||
      config.android?.googleServicesFile ||
      "./google-services.json",
  },
};

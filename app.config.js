const sentryPluginOptions = {
  url: process.env.SENTRY_URL || "https://sentry.io/",
  organization: process.env.SENTRY_ORG || "litloop",
  project: process.env.SENTRY_PROJECT || "react-native",
};

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ||
      config.android?.googleServicesFile ||
      "./google-services.json",
  },
  plugins: [
    ...(config.plugins ?? []),
    ["@sentry/react-native/expo", sentryPluginOptions],
  ],
});

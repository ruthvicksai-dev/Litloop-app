const fs = require("fs");
const path = require("path");

const sentryPluginOptions = {
  url: process.env.SENTRY_URL || "https://sentry.io/",
  organization: process.env.SENTRY_ORG || "litloop",
  project: process.env.SENTRY_PROJECT || "react-native",
};

function getGoogleServicesFile(config) {
  const candidate = process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile;
  if (!candidate) return undefined;

  const absolutePath = path.isAbsolute(candidate)
    ? candidate
    : path.resolve(__dirname, candidate);

  return fs.existsSync(absolutePath) ? candidate : undefined;
}

module.exports = ({ config }) => {
  const googleServicesFile = getGoogleServicesFile(config);
  const { googleServicesFile: _missingGoogleServicesFile, ...androidConfig } =
    config.android ?? {};

  return {
    ...config,
    android: {
      ...androidConfig,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ["@sentry/react-native/expo", sentryPluginOptions],
    ],
  };
};

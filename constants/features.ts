export const isGoogleSignInEnabled =
    typeof process !== "undefined" &&
    process.env &&
    process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_ENABLED === "true";


# Deployment

LitLoop deploys through two systems:

- Convex for backend functions, database schema, storage, crons, and HTTP routes.
- Expo Application Services (EAS) for native Android/iOS builds and updates.

Related diagram: [Deployment Flow](./diagrams/deployment-flow.md).

## Environments

Recommended environment separation:

| Environment | Convex | EAS profile | Purpose |
| --- | --- | --- | --- |
| Development | `npx convex dev` | `development` | Local app work with dev client. |
| Preview | Convex preview/prod-like deployment | `preview` | Internal QA builds. |
| Production | Production Convex deployment | `production` | Store-ready release. |

Keep secrets in Convex env and EAS secrets. Do not commit `.env.local`, Google service files, keystores, or API secrets.

## Convex Deployment

Run local backend:

```bash
npx convex dev
```

Deploy backend:

```bash
npx convex deploy
```

Set backend secrets:

```bash
npx convex env set JWT_ACCESS_SECRET "<strong-secret>"
npx convex env set JWT_REFRESH_SECRET "<strong-secret>"
npx convex env set GOOGLE_CLIENT_ID "<google-client-id>"
npx convex env set RESEND_API_KEY "<resend-api-key>"
```

Production must not set `USE_DEV_OTP=true`.

## Expo EAS Setup

Install/use EAS CLI:

```bash
npx eas login
npx eas build:configure
```

The app already contains:

- `app.json` with Android package `com.ruthvicksai.litloop` and iOS bundle identifier `com.ruthvicksai.litloop`.
- `eas.json` with `development`, `preview`, and `production` profiles.
- `app.config.js` that wires Sentry and Android `googleServicesFile`.

Create required EAS secrets:

```bash
npx eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
npx eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value "<convex-url>"
npx eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_SITE_URL --value "<convex-site-url>"
npx eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value "<maps-key>"
```

Add Google sign-in, Sentry, and owner variables as needed for the target platform.

## Android Production Build

Preview APK/internal build:

```bash
npx eas build --profile preview --platform android
```

Production Play Store build:

```bash
npx eas build --profile production --platform android
```

By default, production Android builds for Play Store should produce an AAB. Use APK only for direct/internal distribution when appropriate.

## APK/AAB Guidance

- Use AAB for Google Play production and closed testing tracks.
- Use APK for QA sideloading or manual device testing.
- Keep package name stable once released.
- Use remote app versioning as configured by `eas.json`.
- Let EAS manage Android signing unless there is a deliberate keystore migration plan.

## OTA Updates

Use EAS Update only for JavaScript/assets changes that do not require native rebuilds:

```bash
npx eas update --branch production --message "Describe update"
```

Native rebuild required when changing:

- Expo SDK/native dependencies.
- Android/iOS permissions.
- App icon/splash/native config.
- Google services files.
- Sentry native plugin behavior.
- `expo-build-properties`.

## Release Workflow

1. Confirm branch is clean except intended changes.
2. Run `npm install` if dependencies changed.
3. Run lint.
4. Deploy Convex.
5. Confirm Convex env vars are set for production.
6. Smoke-test local app against production-like backend.
7. Build preview artifact and test auth, rentals, payments, verification, notifications.
8. Build production artifact with EAS.
9. Upload AAB to Google Play internal/closed testing.
10. Monitor Sentry and Convex logs after rollout.

## Store Listing Links

Use these public URLs for launch metadata:

| Item | URL |
| --- | --- |
| Marketing website | `https://litloop.in` |
| Privacy Policy | `https://litloop.in/privacy-policy` |
| Terms of Service | `https://litloop.in/terms-of-service` |

Google Play requires a privacy policy URL for apps that handle sensitive user/device data and for the Data safety form. LitLoop also has in-app account deletion; if Play Console asks for a public account deletion URL, add a dedicated page on `litloop.in` that explains the in-app deletion path and support contact.

## Production Checklist

- `EXPO_PUBLIC_CONVEX_URL` points to production Convex.
- `EXPO_PUBLIC_CONVEX_SITE_URL` points to production Convex site.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong and different.
- `RESEND_API_KEY` is configured.
- `USE_DEV_OTP` is absent or false.
- Google OAuth client IDs match package/bundle IDs and redirect URI.
- Google Maps API key is restricted to the app/platform.
- `google-services.json` is available through EAS secret file.
- Sentry DSN and auth token are configured for release monitoring/source maps.
- Privacy Policy URL is set to `https://litloop.in/privacy-policy`.
- Terms/support links are available from `https://litloop.in`.
- Android permissions are justified and store listing disclosures match app behavior.
- Payment UPI settings are configured in the admin UI.
- At least one admin account exists.
- Student verification and payment review queues are tested.
- Push token registration is tested on a physical device.
- Account deletion flow is tested for Play policy compliance.

## App Signing

Use EAS-managed credentials for early-stage production unless there is a strong operational reason not to.

Best practices:

- Store keystore recovery details in a secure password manager.
- Limit access to EAS credentials.
- Do not rotate signing credentials without a store migration plan.
- Keep Google Play App Signing enabled for Play distribution.

## Rollback

- Backend: deploy a known-good Convex version from Git.
- OTA: publish a known-good EAS Update to the production branch.
- Native: halt rollout in the store console and promote the last good build if needed.

For data migrations, prefer forward-compatible schema changes and backfill functions with pagination.

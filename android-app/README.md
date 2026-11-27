# TDH48 Music Player — Android preparation

This folder is an isolated Capacitor Android wrapper. It does not modify the Next.js website or its Vercel deployment.

- App name: TDH48 Music Player
- Android application ID: `com.tdh48.musicplayer`
- Web origin: `https://tdh48-music-player-official.vercel.app`
- Capacitor major: 8

## Prerequisites

- Node.js 22+
- Android Studio with Android SDK
- Android Studio 2025.2.1 or newer (it supplies the supported JDK)
- A Google Play Console developer account before store submission

## Create the native Android project

From this directory:

```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

The generated `android/` directory contains the native Gradle project. Build a signed Android App Bundle (.aab) from Android Studio after configuring the release signing key.

## Important release work still required

This initial shell is not a Play Store-ready release. Before submission:

1. Test authentication, album navigation, playback, lyrics, and mobile layouts on physical Android devices.
2. Verify background playback and lock-screen/media notification controls. A remote web player alone does not guarantee reliable background playback; implement and test native media-session integration if needed.
3. Add original app launcher icons and splash assets.
4. Add a privacy policy URL and complete Play Console Data safety, content rating, target audience, and app access declarations.
5. Confirm rights to distribute all music and lyrics publicly.
6. Use a stable production web origin and test the app's behavior when the service is unavailable.
7. Configure Play App Signing and upload a signed AAB.

The app currently loads the existing public web app over HTTPS. This keeps the website source and Vercel deployment independent from the Android wrapper, but means an internet connection is required and Play review may require additional native value and policy checks.

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tdh48.musicplayer',
  appName: 'TDH48 Music Player',
  webDir: 'www',
  server: {
    // The Android shell loads the existing public web app.
    // Keep the web app deployed independently; do not change its Vercel project.
    url: 'https://tdh48-music-player-official.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#fff1f7',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#fff1f7',
    },
  },
};

export default config;

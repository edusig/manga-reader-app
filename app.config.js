import 'dotenv/config';

export default () => ({
  expo: {
    name: 'manga-reader-app',
    slug: 'manga-reader-app',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/f29aae26-2042-4481-aa3b-fb197483345d',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.edusig.mangareaderapp',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    description: '',
    extra: {
      eas: {
        projectId: 'f29aae26-2042-4481-aa3b-fb197483345d',
      },
      advancedPassword: process.env.ADVANCED_PASSWORD,
      adultTags: (process.env.ADULT_TAGS ?? '').split(','),
      defaultFileServer: process.env.DEFAULT_FILE_SERVER,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
});

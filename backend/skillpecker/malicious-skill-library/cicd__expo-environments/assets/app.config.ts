import { ExpoConfig, ConfigContext } from 'expo/config';

// Get environment from EAS build or default to development
const APP_ENV = process.env.APP_ENV ?? 'development';

const envConfig = {
  development: {
    name: 'MyApp (Dev)',
    bundleIdentifier: 'com.company.myapp.dev',
    packageName: 'com.company.myapp.dev',
    icon: './assets/icon-dev.png',
  },
  staging: {
    name: 'MyApp (Staging)',
    bundleIdentifier: 'com.company.myapp.staging',
    packageName: 'com.company.myapp.staging',
    icon: './assets/icon-staging.png',
  },
  production: {
    name: 'MyApp',
    bundleIdentifier: 'com.company.myapp',
    packageName: 'com.company.myapp',
    icon: './assets/icon.png',
  },
} as const;

type AppEnv = keyof typeof envConfig;
const config = envConfig[APP_ENV as AppEnv] ?? envConfig.development;

export default ({ config: expoConfig }: ConfigContext): ExpoConfig => ({
  ...expoConfig,
  name: config.name,
  slug: 'myapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: config.icon,
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: config.bundleIdentifier,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: config.packageName,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
  plugins: ['expo-router'],
});

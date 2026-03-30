---
name: expo-environments
description: >
  Configure multi-environment setup for Expo apps with EAS Build.
  Trigger: When setting up dev/staging/production environments, configuring environment variables, or creating EAS build profiles.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Setting up Expo multi-environment configuration"
    - "Configuring EAS Build profiles"
    - "Managing environment variables in Expo/React Native"
---

## When to Use

- Setting up a new Expo project with multiple environments
- Configuring environment variables for dev, staging, production
- Creating EAS Build profiles for different environments
- Need different app identifiers/names per environment
- Managing API URLs, feature flags, or service keys per environment

## Critical Patterns

### 1. Environment Variable Naming

All client-accessible variables MUST use `EXPO_PUBLIC_` prefix:

```bash
# Correct - accessible in app code
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_FIREBASE_API_KEY=xxx

# Wrong - NOT accessible in app code
API_URL=https://api.example.com
```

### 2. File Structure

```
project/
├── app.config.ts           # Dynamic config (NOT app.json)
├── eas.json                # EAS Build profiles
├── .env                    # Local development (gitignored)
├── .env.example            # Template for team
└── src/
    └── config/
        └── env.ts          # Type-safe env access
```

### 3. Three-Environment Setup

| Environment | Purpose | Distribution | App Suffix |
|-------------|---------|--------------|------------|
| `development` | Local dev with dev client | simulator/internal | `.dev` |
| `staging` | QA/testing builds | internal | `.staging` |
| `production` | Store releases | store | (none) |

## Configuration Files

### eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "base": {
      "node": "20.0.0",
      "env": {
        "APP_ENV": "development"
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development",
        "EXPO_PUBLIC_API_URL": "http://localhost:3000/api"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "simulator": true
      }
    },
    "staging": {
      "extends": "base",
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging-api.example.com"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    },
    "production": {
      "extends": "base",
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.example.com"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "production"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

### app.config.ts

```typescript
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
```

### src/config/env.ts

```typescript
/**
 * Type-safe environment variable access
 * All EXPO_PUBLIC_ variables are inlined at build time
 */

type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  APP_ENV: Environment;
  API_URL: string;
  FIREBASE_API_KEY?: string;
  SENTRY_DSN?: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined`);
    return '';
  }
  return value;
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not defined`);
  }
  return value;
}

export const env: EnvConfig = {
  APP_ENV: (process.env.APP_ENV as Environment) ?? 'development',
  API_URL: getRequiredEnvVar('EXPO_PUBLIC_API_URL'),
  FIREBASE_API_KEY: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  SENTRY_DSN: getEnvVar('EXPO_PUBLIC_SENTRY_DSN'),
};

export const isDev = env.APP_ENV === 'development';
export const isStaging = env.APP_ENV === 'staging';
export const isProd = env.APP_ENV === 'production';
```

### .env.example

```bash
# Environment (development | staging | production)
APP_ENV=development

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Firebase (optional)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=

# Sentry (optional)
EXPO_PUBLIC_SENTRY_DSN=

# Feature Flags (optional)
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
```

## Commands

```bash
# Local development
npx expo start

# Pull environment variables from EAS (for local dev)
eas env:pull --environment development

# Build for each environment
eas build --profile development --platform all
eas build --profile staging --platform all
eas build --profile production --platform all

# Build specific platform
eas build --profile staging --platform android
eas build --profile staging --platform ios

# Submit to stores (production only)
eas submit --profile production --platform all

# Check current EAS configuration
eas config --profile staging

# List all builds
eas build:list
```

## Sensitive Variables (EAS Secrets)

For API keys and secrets that should NOT be in version control:

```bash
# Set secret in EAS (stored securely, not in repo)
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-key" --scope project

# List secrets
eas secret:list

# Delete secret
eas secret:delete EXPO_PUBLIC_FIREBASE_API_KEY
```

Secrets set via `eas secret:create` override values in `eas.json`.

## Checklist for New Project

- [ ] Convert `app.json` to `app.config.ts`
- [ ] Create `eas.json` with all three profiles
- [ ] Create `.env.example` with all variables
- [ ] Add `.env` to `.gitignore`
- [ ] Create `src/config/env.ts` for type-safe access
- [ ] Set up EAS secrets for sensitive keys
- [ ] Create different app icons per environment (optional but recommended)
- [ ] Test each build profile locally with `eas build --local`

## Resources

- **Templates**: See [assets/](assets/) for starter configs

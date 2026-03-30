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

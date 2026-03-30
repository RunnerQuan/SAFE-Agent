/**
 * Configuration management for SendGrid CLI
 * Handles reading/writing config from ~/.config/sendgrid/config.json
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";

export interface SendGridConfig {
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Get the config directory path
 */
export function getConfigDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
  return join(home, ".config", "sendgrid");
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

/**
 * Load configuration from file and environment
 * Priority: ENV vars > config file
 */
export async function loadConfig(): Promise<SendGridConfig> {
  const config: SendGridConfig = {};

  // Try to load from config file
  try {
    const configPath = getConfigPath();
    const content = await Deno.readTextFile(configPath);
    const fileConfig = JSON.parse(content) as SendGridConfig;
    Object.assign(config, fileConfig);
  } catch {
    // Config file doesn't exist or is invalid, that's fine
  }

  // Override with environment variables (higher priority)
  const envApiKey = Deno.env.get("SENDGRID_API_KEY");
  const envFromEmail = Deno.env.get("SENDGRID_FROM_EMAIL");
  const envFromName = Deno.env.get("SENDGRID_FROM_NAME");

  if (envApiKey) config.apiKey = envApiKey;
  if (envFromEmail) config.fromEmail = envFromEmail;
  if (envFromName) config.fromName = envFromName;

  return config;
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: SendGridConfig): Promise<void> {
  const configDir = getConfigDir();
  await ensureDir(configDir);

  const configPath = getConfigPath();
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

  // Set restrictive permissions (owner read/write only)
  if (Deno.build.os !== "windows") {
    await Deno.chmod(configPath, 0o600);
  }
}

/**
 * Get a required config value, throwing if not set
 */
export function requireConfig(config: SendGridConfig, key: keyof SendGridConfig): string {
  const value = config[key];
  if (!value) {
    const envName = key === "apiKey" ? "SENDGRID_API_KEY" : `SENDGRID_${key.toUpperCase().replace(/([A-Z])/g, "_$1")}`;
    throw new Error(
      `Missing required configuration: ${key}\n` +
      `Set it via:\n` +
      `  - Environment variable: ${envName}\n` +
      `  - Run: sendgrid auth login --api-key YOUR_KEY`
    );
  }
  return value;
}

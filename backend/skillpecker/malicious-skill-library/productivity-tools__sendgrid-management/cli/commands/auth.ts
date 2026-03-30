import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import { loadConfig, saveConfig } from "../lib/config.ts";
import * as output from "../lib/output.ts";

export const authCommands = {
  login: {
    description: "Set API key for authentication",
    usage: "sendgrid auth login --api-key SG.xxx",
    run: authLogin,
  },
  logout: {
    description: "Remove saved API key",
    usage: "sendgrid auth logout",
    run: authLogout,
  },
  status: {
    description: "Check authentication status",
    usage: "sendgrid auth status",
    run: authStatus,
  },
};

async function authLogin(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["api-key", "from-email", "from-name"],
    alias: { k: "api-key", e: "from-email", n: "from-name" },
  });

  if (!flags["api-key"]) {
    output.error("API key required (--api-key)");
    output.info("Get your API key from https://app.sendgrid.com/settings/api_keys");
    Deno.exit(1);
  }

  const config = await loadConfig();
  config.apiKey = flags["api-key"];
  if (flags["from-email"]) config.fromEmail = flags["from-email"];
  if (flags["from-name"]) config.fromName = flags["from-name"];

  const testClient = await SendGridClient.createWithConfig(config);
  const result = await testClient.verifyAuth();

  if (!result.ok) {
    output.error(`Authentication failed: ${result.errors?.[0]?.message || "Invalid API key"}`);
    Deno.exit(1);
  }

  await saveConfig(config);
  output.success(`Authenticated as ${result.data?.email || result.data?.username || "unknown"}`);
  output.info(`Config saved to ~/.config/sendgrid/config.json`);
}

async function authLogout(_args: string[]): Promise<void> {
  const config = await loadConfig();
  delete config.apiKey;
  await saveConfig(config);
  output.success("Logged out - API key removed from config");
}

async function authStatus(_args: string[]): Promise<void> {
  try {
    const client = await SendGridClient.create();
    const result = await client.verifyAuth();

    if (result.ok) {
      output.heading("Authentication Status");
      output.keyValue([
        ["Status", "Authenticated"],
        ["Email", result.data?.email],
        ["Username", result.data?.username],
      ]);
    } else {
      output.error(`Authentication invalid: ${result.errors?.[0]?.message}`);
      Deno.exit(1);
    }
  } catch (err) {
    output.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

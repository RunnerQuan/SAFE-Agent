import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const apikeyCommands = {
  list: {
    description: "List API keys",
    usage: "sendgrid apikey list",
    run: apikeyList,
  },
  get: {
    description: "Get API key details",
    usage: "sendgrid apikey get <api-key-id>",
    run: apikeyGet,
  },
  create: {
    description: "Create an API key",
    usage: "sendgrid apikey create --name 'My Key' [--scopes mail.send,templates.read]",
    run: apikeyCreate,
  },
  update: {
    description: "Update an API key",
    usage: "sendgrid apikey update <api-key-id> --name 'New Name'",
    run: apikeyUpdate,
  },
  delete: {
    description: "Delete an API key",
    usage: "sendgrid apikey delete <api-key-id>",
    run: apikeyDelete,
  },
  scopes: {
    description: "List available scopes",
    usage: "sendgrid apikey scopes",
    run: apikeyScopes,
  },
};

async function apikeyList(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listApiKeys();

  if (!result.ok) {
    output.error(`Failed to list API keys: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const keys = result.data?.result || [];
  if (keys.length === 0) {
    output.info("No API keys found");
    return;
  }

  output.table(
    ["ID", "Name"],
    keys.map(k => [k.api_key_id, k.name])
  );
}

async function apikeyGet(args: string[]): Promise<void> {
  const keyId = args[0];
  if (!keyId) {
    output.error("API key ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getApiKey(keyId);

  if (!result.ok) {
    output.error(`Failed to get API key: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const key = result.data!;
  output.heading(key.name);
  output.keyValue([
    ["ID", key.api_key_id],
    ["Name", key.name],
  ]);

  if (key.scopes && key.scopes.length > 0) {
    console.log("\nScopes:");
    output.list(key.scopes);
  }
}

async function apikeyCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name", "scopes"],
    boolean: ["full-access"],
    alias: { n: "name", s: "scopes" },
  });

  if (!flags.name) {
    output.error("Name required (--name)");
    Deno.exit(1);
  }

  let scopes: string[] | undefined;
  
  if (flags["full-access"]) {
    scopes = undefined;
  } else if (flags.scopes) {
    scopes = flags.scopes.split(",");
  } else {
    scopes = ["mail.send"];
    output.warn("No scopes specified, defaulting to mail.send only");
    output.info("Use --full-access for full permissions or --scopes for specific permissions");
  }

  const client = await SendGridClient.create();
  const result = await client.createApiKey({
    name: flags.name,
    scopes,
  });

  if (!result.ok) {
    output.error(`Failed to create API key: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`API key created: ${result.data!.name}`);
  output.info(`ID: ${result.data!.api_key_id}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("IMPORTANT: Save this key now - it won't be shown again!");
  console.log("=".repeat(60));
  console.log(`\nAPI Key: ${result.data!.api_key}`);
  console.log("\n" + "=".repeat(60));
}

async function apikeyUpdate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name", "scopes"],
    alias: { n: "name", s: "scopes" },
  });

  const keyId = flags._[0] as string;
  if (!keyId) {
    output.error("API key ID required");
    Deno.exit(1);
  }

  if (!flags.name && !flags.scopes) {
    output.error("Provide --name or --scopes to update");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();

  if (flags.name && !flags.scopes) {
    const result = await client.updateApiKeyName(keyId, flags.name);
    if (!result.ok) {
      output.error(`Failed to update API key: ${result.errors?.[0]?.message}`);
      Deno.exit(1);
    }
  } else {
    const currentResult = await client.getApiKey(keyId);
    if (!currentResult.ok) {
      output.error(`Failed to get current key: ${currentResult.errors?.[0]?.message}`);
      Deno.exit(1);
    }

    const result = await client.updateApiKey(keyId, {
      name: flags.name || currentResult.data!.name,
      scopes: flags.scopes ? flags.scopes.split(",") : currentResult.data!.scopes,
    });

    if (!result.ok) {
      output.error(`Failed to update API key: ${result.errors?.[0]?.message}`);
      Deno.exit(1);
    }
  }

  output.success("API key updated");
}

async function apikeyDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["force"],
    alias: { f: "force", y: "force" },
  });

  const keyId = flags._[0] as string;
  if (!keyId) {
    output.error("API key ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const confirm = prompt(`Delete API key ${keyId}? This cannot be undone! [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteApiKey(keyId);

  if (!result.ok) {
    output.error(`Failed to delete API key: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("API key deleted");
}

async function apikeyScopes(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listScopes();

  if (!result.ok) {
    output.error(`Failed to list scopes: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const scopes = result.data?.scopes || [];
  
  output.heading("Available Scopes");

  const grouped: Record<string, string[]> = {};
  for (const scope of scopes) {
    const [category] = scope.split(".");
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(scope);
  }

  for (const [category, categoryScopes] of Object.entries(grouped).sort()) {
    console.log(`\n${category}:`);
    output.list(categoryScopes.sort());
  }

  output.info(`\nTotal: ${scopes.length} scopes`);
}

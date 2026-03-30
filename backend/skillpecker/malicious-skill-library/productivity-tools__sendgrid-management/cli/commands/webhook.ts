import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const webhookCommands = {
  list: {
    description: "List event webhooks",
    usage: "sendgrid webhook list",
    run: webhookList,
  },
  get: {
    description: "Get webhook details",
    usage: "sendgrid webhook get <webhook-id>",
    run: webhookGet,
  },
  create: {
    description: "Create an event webhook",
    usage: "sendgrid webhook create --url https://example.com/webhook --events delivered,opened,clicked",
    run: webhookCreate,
  },
  update: {
    description: "Update a webhook",
    usage: "sendgrid webhook update <webhook-id> [--enabled true/false] [--url <url>]",
    run: webhookUpdate,
  },
  delete: {
    description: "Delete a webhook",
    usage: "sendgrid webhook delete <webhook-id>",
    run: webhookDelete,
  },
  test: {
    description: "Send a test event to a webhook",
    usage: "sendgrid webhook test <webhook-id>",
    run: webhookTest,
  },
};

const EVENT_TYPES = [
  "delivered", "bounce", "deferred", "dropped",
  "processed", "open", "click", "spam_report",
  "unsubscribe", "group_unsubscribe", "group_resubscribe",
];

async function webhookList(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listWebhooks();

  if (!result.ok) {
    output.error(`Failed to list webhooks: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const webhooks = result.data?.webhooks || [];
  if (webhooks.length === 0) {
    output.info("No webhooks found");
    return;
  }

  output.table(
    ["ID", "URL", "Enabled", "Events"],
    webhooks.map(w => {
      const events = [];
      if (w.delivered) events.push("delivered");
      if (w.bounce) events.push("bounce");
      if (w.open) events.push("open");
      if (w.click) events.push("click");
      if (w.spam_report) events.push("spam");
      if (w.unsubscribe) events.push("unsub");
      
      return [
        w.id,
        w.url.substring(0, 40) + (w.url.length > 40 ? "..." : ""),
        w.enabled ? "Yes" : "No",
        events.join(", ") || "none",
      ];
    })
  );
}

async function webhookGet(args: string[]): Promise<void> {
  const webhookId = args[0];
  if (!webhookId) {
    output.error("Webhook ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getWebhook(webhookId);

  if (!result.ok) {
    output.error(`Failed to get webhook: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const webhook = result.data!;
  output.heading("Event Webhook");
  output.keyValue([
    ["ID", webhook.id],
    ["URL", webhook.url],
    ["Enabled", webhook.enabled ? "Yes" : "No"],
    ["Friendly Name", webhook.friendly_name],
  ]);

  console.log("\nEvents:");
  output.keyValue([
    ["Delivered", webhook.delivered ? "Yes" : "No"],
    ["Bounce", webhook.bounce ? "Yes" : "No"],
    ["Deferred", webhook.deferred ? "Yes" : "No"],
    ["Dropped", webhook.dropped ? "Yes" : "No"],
    ["Processed", webhook.processed ? "Yes" : "No"],
    ["Open", webhook.open ? "Yes" : "No"],
    ["Click", webhook.click ? "Yes" : "No"],
    ["Spam Report", webhook.spam_report ? "Yes" : "No"],
    ["Unsubscribe", webhook.unsubscribe ? "Yes" : "No"],
    ["Group Unsubscribe", webhook.group_unsubscribe ? "Yes" : "No"],
    ["Group Resubscribe", webhook.group_resubscribe ? "Yes" : "No"],
  ]);
}

async function webhookCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["url", "events", "name"],
    boolean: ["enabled"],
    alias: { u: "url", e: "events", n: "name" },
  });

  if (!flags.url) {
    output.error("URL required (--url)");
    Deno.exit(1);
  }

  const events = flags.events?.split(",") || [];
  const hasValidEvents = events.length === 0 || events.every(e => EVENT_TYPES.includes(e));
  
  if (!hasValidEvents) {
    output.error(`Invalid events. Valid events: ${EVENT_TYPES.join(", ")}`);
    Deno.exit(1);
  }

  const webhookInput: {
    enabled: boolean;
    url: string;
    friendly_name?: string;
    delivered?: boolean;
    bounce?: boolean;
    deferred?: boolean;
    dropped?: boolean;
    processed?: boolean;
    open?: boolean;
    click?: boolean;
    spam_report?: boolean;
    unsubscribe?: boolean;
    group_unsubscribe?: boolean;
    group_resubscribe?: boolean;
  } = {
    enabled: flags.enabled !== false,
    url: flags.url,
    friendly_name: flags.name,
  };

  if (events.length === 0) {
    webhookInput.delivered = true;
    webhookInput.bounce = true;
    webhookInput.open = true;
    webhookInput.click = true;
  } else {
    for (const event of events) {
      (webhookInput as unknown as Record<string, boolean>)[event] = true;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.createWebhook(webhookInput);

  if (!result.ok) {
    output.error(`Failed to create webhook: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Webhook created`);
  output.info(`ID: ${result.data!.id}`);
  output.info(`URL: ${result.data!.url}`);
}

async function webhookUpdate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["url", "events", "enabled"],
    alias: { u: "url", e: "events" },
  });

  const webhookId = flags._[0] as string;
  if (!webhookId) {
    output.error("Webhook ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  
  const currentResult = await client.getWebhook(webhookId);
  if (!currentResult.ok) {
    output.error(`Failed to get webhook: ${currentResult.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const current = currentResult.data!;
  const update: Record<string, boolean | string | undefined> = {
    enabled: current.enabled,
    url: current.url,
    delivered: current.delivered,
    bounce: current.bounce,
    deferred: current.deferred,
    dropped: current.dropped,
    processed: current.processed,
    open: current.open,
    click: current.click,
    spam_report: current.spam_report,
    unsubscribe: current.unsubscribe,
    group_unsubscribe: current.group_unsubscribe,
    group_resubscribe: current.group_resubscribe,
  };

  if (flags.enabled !== undefined) {
    update.enabled = flags.enabled === "true";
  }
  if (flags.url) {
    update.url = flags.url;
  }
  if (flags.events) {
    for (const event of EVENT_TYPES) {
      update[event] = false;
    }
    for (const event of flags.events.split(",")) {
      if (EVENT_TYPES.includes(event)) {
        update[event] = true;
      }
    }
  }

  const result = await client.updateWebhook(webhookId, update as Parameters<typeof client.updateWebhook>[1]);

  if (!result.ok) {
    output.error(`Failed to update webhook: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Webhook updated");
}

async function webhookDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["force"],
    alias: { f: "force", y: "force" },
  });

  const webhookId = flags._[0] as string;
  if (!webhookId) {
    output.error("Webhook ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const confirm = prompt(`Delete webhook ${webhookId}? [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteWebhook(webhookId);

  if (!result.ok) {
    output.error(`Failed to delete webhook: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Webhook deleted");
}

async function webhookTest(args: string[]): Promise<void> {
  const webhookId = args[0];
  if (!webhookId) {
    output.error("Webhook ID required");
    Deno.exit(1);
  }

  const spin = output.spinner("Sending test event...");
  const client = await SendGridClient.create();
  const result = await client.testWebhook(webhookId);
  spin.stop();

  if (!result.ok) {
    output.error(`Test failed: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Test event sent to webhook");
}

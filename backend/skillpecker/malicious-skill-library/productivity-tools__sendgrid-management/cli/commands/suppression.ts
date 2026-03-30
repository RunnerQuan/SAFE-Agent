import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const suppressionCommands = {
  bounces: {
    description: "List bounced emails",
    usage: "sendgrid suppression bounces [--start-time 2024-01-01] [--limit 100]",
    run: suppressionBounces,
  },
  blocks: {
    description: "List blocked emails",
    usage: "sendgrid suppression blocks [--start-time 2024-01-01]",
    run: suppressionBlocks,
  },
  "spam-reports": {
    description: "List spam reports",
    usage: "sendgrid suppression spam-reports",
    run: suppressionSpamReports,
  },
  unsubscribes: {
    description: "List global unsubscribes",
    usage: "sendgrid suppression unsubscribes",
    run: suppressionUnsubscribes,
  },
  "invalid-emails": {
    description: "List invalid emails",
    usage: "sendgrid suppression invalid-emails",
    run: suppressionInvalidEmails,
  },
  groups: {
    description: "List suppression groups",
    usage: "sendgrid suppression groups",
    run: suppressionGroups,
  },
  delete: {
    description: "Delete from suppression list",
    usage: "sendgrid suppression delete <type> <email>",
    run: suppressionDelete,
  },
  add: {
    description: "Add to global unsubscribe",
    usage: "sendgrid suppression add unsubscribe <email1,email2,...>",
    run: suppressionAdd,
  },
};

function parseSuppressionParams(args: string[]) {
  const flags = parseArgs(args, {
    string: ["start-time", "end-time", "limit", "offset", "email"],
  });

  const params: {
    start_time?: number;
    end_time?: number;
    limit?: number;
    offset?: number;
    email?: string;
  } = {};

  if (flags["start-time"]) {
    params.start_time = Math.floor(new Date(flags["start-time"]).getTime() / 1000);
  }
  if (flags["end-time"]) {
    params.end_time = Math.floor(new Date(flags["end-time"]).getTime() / 1000);
  }
  if (flags.limit) {
    params.limit = parseInt(flags.limit);
  }
  if (flags.offset) {
    params.offset = parseInt(flags.offset);
  }
  if (flags.email) {
    params.email = flags.email;
  }

  return params;
}

async function suppressionBounces(args: string[]): Promise<void> {
  const params = parseSuppressionParams(args);
  const client = await SendGridClient.create();
  const result = await client.listBounces(params);

  if (!result.ok) {
    output.error(`Failed to list bounces: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const bounces = result.data || [];
  if (bounces.length === 0) {
    output.info("No bounces found");
    return;
  }

  output.table(
    ["Email", "Reason", "Status", "Date"],
    bounces.map(b => [
      b.email,
      b.reason.substring(0, 50) + (b.reason.length > 50 ? "..." : ""),
      b.status,
      new Date(b.created * 1000).toLocaleDateString(),
    ])
  );
  output.info(`Total: ${bounces.length}`);
}

async function suppressionBlocks(args: string[]): Promise<void> {
  const params = parseSuppressionParams(args);
  const client = await SendGridClient.create();
  const result = await client.listBlocks(params);

  if (!result.ok) {
    output.error(`Failed to list blocks: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const blocks = result.data || [];
  if (blocks.length === 0) {
    output.info("No blocks found");
    return;
  }

  output.table(
    ["Email", "Reason", "Date"],
    blocks.map(b => [
      b.email,
      b.reason.substring(0, 60) + (b.reason.length > 60 ? "..." : ""),
      new Date(b.created * 1000).toLocaleDateString(),
    ])
  );
  output.info(`Total: ${blocks.length}`);
}

async function suppressionSpamReports(args: string[]): Promise<void> {
  const params = parseSuppressionParams(args);
  const client = await SendGridClient.create();
  const result = await client.listSpamReports(params);

  if (!result.ok) {
    output.error(`Failed to list spam reports: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const reports = result.data || [];
  if (reports.length === 0) {
    output.info("No spam reports found");
    return;
  }

  output.table(
    ["Email", "IP", "Date"],
    reports.map(r => [
      r.email,
      r.ip || "N/A",
      new Date(r.created * 1000).toLocaleDateString(),
    ])
  );
  output.info(`Total: ${reports.length}`);
}

async function suppressionUnsubscribes(args: string[]): Promise<void> {
  const params = parseSuppressionParams(args);
  const client = await SendGridClient.create();
  const result = await client.listUnsubscribes(params);

  if (!result.ok) {
    output.error(`Failed to list unsubscribes: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const unsubs = result.data || [];
  if (unsubs.length === 0) {
    output.info("No global unsubscribes found");
    return;
  }

  output.table(
    ["Email", "Date"],
    unsubs.map(u => [
      u.email,
      new Date(u.created * 1000).toLocaleDateString(),
    ])
  );
  output.info(`Total: ${unsubs.length}`);
}

async function suppressionInvalidEmails(args: string[]): Promise<void> {
  const params = parseSuppressionParams(args);
  const client = await SendGridClient.create();
  const result = await client.listInvalidEmails(params);

  if (!result.ok) {
    output.error(`Failed to list invalid emails: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const invalids = result.data || [];
  if (invalids.length === 0) {
    output.info("No invalid emails found");
    return;
  }

  output.table(
    ["Email", "Reason", "Date"],
    invalids.map(i => [
      i.email,
      i.reason.substring(0, 50) + (i.reason.length > 50 ? "..." : ""),
      new Date(i.created * 1000).toLocaleDateString(),
    ])
  );
  output.info(`Total: ${invalids.length}`);
}

async function suppressionGroups(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listSuppressionGroups();

  if (!result.ok) {
    output.error(`Failed to list groups: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const groups = result.data || [];
  if (groups.length === 0) {
    output.info("No suppression groups found");
    return;
  }

  output.table(
    ["ID", "Name", "Default", "Unsubscribes"],
    groups.map(g => [
      String(g.id),
      g.name,
      g.is_default ? "Yes" : "No",
      String(g.unsubscribes || 0),
    ])
  );
}

async function suppressionDelete(args: string[]): Promise<void> {
  const [type, email] = args;

  if (!type || !email) {
    output.error("Type and email required");
    output.info("Types: bounce, block, spam-report, invalid-email");
    output.info("Usage: sendgrid suppression delete bounce user@example.com");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  let result;

  switch (type) {
    case "bounce":
      result = await client.deleteBounce(email);
      break;
    case "block":
      result = await client.deleteBlock(email);
      break;
    case "spam-report":
      result = await client.deleteSpamReport(email);
      break;
    case "invalid-email":
      result = await client.deleteInvalidEmail(email);
      break;
    default:
      output.error(`Unknown type: ${type}`);
      output.info("Valid types: bounce, block, spam-report, invalid-email");
      Deno.exit(1);
  }

  if (!result.ok) {
    output.error(`Failed to delete: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Deleted ${email} from ${type} list`);
}

async function suppressionAdd(args: string[]): Promise<void> {
  const [type, emailsArg] = args;

  if (type !== "unsubscribe") {
    output.error("Only 'unsubscribe' type is supported for adding");
    output.info("Usage: sendgrid suppression add unsubscribe email1@example.com,email2@example.com");
    Deno.exit(1);
  }

  if (!emailsArg) {
    output.error("Emails required");
    Deno.exit(1);
  }

  const emails = emailsArg.split(",");
  const client = await SendGridClient.create();
  const result = await client.addToGlobalUnsubscribe(emails);

  if (!result.ok) {
    output.error(`Failed to add: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Added ${emails.length} email(s) to global unsubscribe`);
}

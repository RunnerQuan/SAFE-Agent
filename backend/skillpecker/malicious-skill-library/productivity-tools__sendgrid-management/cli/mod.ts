#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { parseArgs } from "@std/cli/parse-args";
import { bold, cyan, dim } from "@std/fmt/colors";
import { authCommands } from "./commands/auth.ts";
import { mailCommands } from "./commands/mail.ts";
import { templateCommands } from "./commands/template.ts";
import { contactCommands } from "./commands/contact.ts";
import { listCommands } from "./commands/list.ts";
import { suppressionCommands } from "./commands/suppression.ts";
import { statsCommands } from "./commands/stats.ts";
import { senderCommands } from "./commands/sender.ts";
import { domainCommands } from "./commands/domain.ts";
import { webhookCommands } from "./commands/webhook.ts";
import { apikeyCommands } from "./commands/apikey.ts";
import { validateCommands } from "./commands/validate.ts";
import * as output from "./lib/output.ts";

const VERSION = "0.1.0";

interface CommandDef {
  description: string;
  usage: string;
  run: (args: string[]) => Promise<void>;
}

type CommandGroup = Record<string, CommandDef>;

const commands: Record<string, CommandGroup> = {
  auth: authCommands,
  mail: mailCommands,
  template: templateCommands,
  contact: contactCommands,
  list: listCommands,
  suppression: suppressionCommands,
  stats: statsCommands,
  sender: senderCommands,
  domain: domainCommands,
  webhook: webhookCommands,
  apikey: apikeyCommands,
  validate: validateCommands,
};

function printHelp(): void {
  console.log(`
${bold("sendgrid")} - CLI for SendGrid Email Services

${bold("USAGE")}
  sendgrid <command> <subcommand> [options]

${bold("COMMANDS")}
  ${cyan("auth")}         Authentication management
  ${cyan("mail")}         Send transactional emails
  ${cyan("template")}     Manage dynamic templates
  ${cyan("contact")}      Manage contacts
  ${cyan("list")}         Manage contact lists
  ${cyan("suppression")}  View/manage bounces, blocks, spam reports
  ${cyan("stats")}        View email statistics
  ${cyan("sender")}       Manage verified senders
  ${cyan("domain")}       Domain authentication (DKIM, SPF)
  ${cyan("webhook")}      Manage event webhooks
  ${cyan("apikey")}       Manage API keys
  ${cyan("validate")}     Validate email addresses

${bold("GLOBAL OPTIONS")}
  --help, -h     Show help
  --version, -v  Show version
  --json         Output as JSON

${bold("EXAMPLES")}
  sendgrid auth login --api-key SG.xxx
  sendgrid mail send --to user@example.com --subject "Hello" --text "Body"
  sendgrid mail send --to user@example.com --template-id d-xxx --data '{"name":"John"}'
  sendgrid template list
  sendgrid contact add --email user@example.com --first-name John
  sendgrid stats global --days 7
  sendgrid suppression bounces

${bold("ENVIRONMENT VARIABLES")}
  SENDGRID_API_KEY     API key (required)
  SENDGRID_FROM_EMAIL  Default from email
  SENDGRID_FROM_NAME   Default from name

${dim("Run 'sendgrid <command> --help' for command-specific help")}
`);
}

function printCommandHelp(group: string, commandGroup: CommandGroup): void {
  console.log(`
${bold(`sendgrid ${group}`)} - ${getGroupDescription(group)}

${bold("SUBCOMMANDS")}`);

  for (const [name, cmd] of Object.entries(commandGroup)) {
    console.log(`  ${cyan(name.padEnd(16))} ${cmd.description}`);
  }

  console.log(`
${bold("USAGE EXAMPLES")}`);

  for (const [_name, cmd] of Object.entries(commandGroup)) {
    console.log(`  ${dim(cmd.usage)}`);
  }
}

function getGroupDescription(group: string): string {
  const descriptions: Record<string, string> = {
    auth: "Authentication management",
    mail: "Send transactional emails",
    template: "Manage dynamic templates",
    contact: "Manage contacts",
    list: "Manage contact lists",
    suppression: "View/manage bounces, blocks, spam reports",
    stats: "View email statistics",
    sender: "Manage verified senders",
    domain: "Domain authentication (DKIM, SPF)",
    webhook: "Manage event webhooks",
    apikey: "Manage API keys",
    validate: "Validate email addresses",
  };
  return descriptions[group] || "";
}

async function main(): Promise<void> {
  const hasJsonFlag = Deno.args.includes("--json");
  if (hasJsonFlag) {
    output.setOutputFormat("json");
  }

  const args = parseArgs(Deno.args.filter(a => a !== "--json"), {
    boolean: ["help", "version"],
    alias: { h: "help", v: "version" },
    stopEarly: true,
  });

  if (args.version) {
    console.log(`sendgrid ${VERSION}`);
    return;
  }

  const [group, subcommand, ...rest] = args._;

  if (!group || args.help) {
    printHelp();
    return;
  }

  const commandGroup = commands[group as string];
  if (!commandGroup) {
    output.error(`Unknown command: ${group}`);
    output.info("Run 'sendgrid --help' for available commands");
    Deno.exit(1);
  }

  const helpRequested = args.help || subcommand === "--help" || subcommand === "-h";

  if (!subcommand || helpRequested) {
    printCommandHelp(group as string, commandGroup);
    return;
  }

  const command = commandGroup[subcommand as string];
  if (!command) {
    output.error(`Unknown subcommand: ${group} ${subcommand}`);
    printCommandHelp(group as string, commandGroup);
    Deno.exit(1);
  }

  try {
    await command.run(rest.map(String));
  } catch (err) {
    if (err instanceof Error) {
      output.error(err.message);
    } else {
      output.error(String(err));
    }
    Deno.exit(1);
  }
}

main();

import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const senderCommands = {
  list: {
    description: "List verified senders",
    usage: "sendgrid sender list",
    run: senderList,
  },
  get: {
    description: "Get sender details",
    usage: "sendgrid sender get <sender-id>",
    run: senderGet,
  },
  create: {
    description: "Create a verified sender",
    usage: "sendgrid sender create --from-email noreply@example.com --from-name 'Company' --reply-to support@example.com",
    run: senderCreate,
  },
  delete: {
    description: "Delete a verified sender",
    usage: "sendgrid sender delete <sender-id>",
    run: senderDelete,
  },
  resend: {
    description: "Resend verification email",
    usage: "sendgrid sender resend <sender-id>",
    run: senderResend,
  },
};

async function senderList(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listVerifiedSenders();

  if (!result.ok) {
    output.error(`Failed to list senders: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const senders = result.data?.results || [];
  if (senders.length === 0) {
    output.info("No verified senders found");
    return;
  }

  output.table(
    ["ID", "From Email", "From Name", "Reply To", "Verified"],
    senders.map(s => [
      String(s.id),
      s.from_email,
      s.from_name || "",
      s.reply_to,
      s.verified ? "Yes" : "No",
    ])
  );
}

async function senderGet(args: string[]): Promise<void> {
  const senderId = args[0];
  if (!senderId) {
    output.error("Sender ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.listVerifiedSenders();

  if (!result.ok) {
    output.error(`Failed to get sender: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const sender = result.data?.results?.find(s => String(s.id) === senderId);
  if (!sender) {
    output.error(`Sender not found: ${senderId}`);
    Deno.exit(1);
  }

  output.heading(sender.from_email);
  output.keyValue([
    ["ID", String(sender.id)],
    ["Nickname", sender.nickname],
    ["From Email", sender.from_email],
    ["From Name", sender.from_name],
    ["Reply To", sender.reply_to],
    ["Reply To Name", sender.reply_to_name],
    ["Verified", sender.verified ? "Yes" : "No"],
    ["Locked", sender.locked ? "Yes" : "No"],
    ["Address", sender.address],
    ["City", sender.city],
    ["State", sender.state],
    ["Country", sender.country],
  ]);
}

async function senderCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: [
      "from-email", "from-name", "reply-to", "reply-to-name", "nickname",
      "address", "address2", "city", "state", "zip", "country",
    ],
    alias: {
      e: "from-email",
      n: "from-name",
      r: "reply-to",
    },
  });

  if (!flags["from-email"]) {
    output.error("From email required (--from-email)");
    Deno.exit(1);
  }

  if (!flags["reply-to"]) {
    output.error("Reply-to email required (--reply-to)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.createVerifiedSender({
    nickname: flags.nickname || flags["from-email"],
    from_email: flags["from-email"],
    from_name: flags["from-name"],
    reply_to: flags["reply-to"],
    reply_to_name: flags["reply-to-name"],
    address: flags.address,
    address2: flags.address2,
    city: flags.city,
    state: flags.state,
    zip: flags.zip,
    country: flags.country,
  });

  if (!result.ok) {
    output.error(`Failed to create sender: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Sender created: ${result.data!.from_email}`);
  output.info(`ID: ${result.data!.id}`);
  output.info("A verification email has been sent to the from address");
}

async function senderDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["force"],
    alias: { f: "force", y: "force" },
  });

  const senderId = flags._[0] as string;
  if (!senderId) {
    output.error("Sender ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const confirm = prompt(`Delete sender ${senderId}? [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteVerifiedSender(parseInt(senderId));

  if (!result.ok) {
    output.error(`Failed to delete sender: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Sender deleted");
}

async function senderResend(args: string[]): Promise<void> {
  const senderId = args[0];
  if (!senderId) {
    output.error("Sender ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.resendVerifiedSenderVerification(parseInt(senderId));

  if (!result.ok) {
    output.error(`Failed to resend verification: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Verification email sent");
}

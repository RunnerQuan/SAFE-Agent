import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient, type EmailAddress, type Personalization, type Content } from "../lib/client.ts";
import { loadConfig } from "../lib/config.ts";
import * as output from "../lib/output.ts";

export const mailCommands = {
  send: {
    description: "Send an email",
    usage: "sendgrid mail send --to user@example.com --subject 'Hello' --text 'Body'",
    run: mailSend,
  },
};

async function mailSend(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: [
      "to", "cc", "bcc", "from", "from-name", "reply-to",
      "subject", "text", "html", "html-file", "text-file",
      "template-id", "data", "data-file",
      "send-at", "batch-id", "category",
      "attachment",
    ],
    boolean: ["sandbox"],
    collect: ["to", "cc", "bcc", "category", "attachment"],
    alias: {
      t: "to",
      f: "from",
      s: "subject",
    },
  });

  const config = await loadConfig();

  const toList = (flags.to as string[]) || [];
  if (toList.length === 0) {
    output.error("At least one recipient required (--to)");
    Deno.exit(1);
  }

  const fromEmail = flags.from || config.fromEmail;
  if (!fromEmail) {
    output.error("From email required (--from or SENDGRID_FROM_EMAIL)");
    Deno.exit(1);
  }

  const templateId = flags["template-id"];
  const subject = flags.subject;
  const textContent = flags.text || (flags["text-file"] ? await Deno.readTextFile(flags["text-file"]) : undefined);
  const htmlContent = flags.html || (flags["html-file"] ? await Deno.readTextFile(flags["html-file"]) : undefined);

  if (!templateId && !subject) {
    output.error("Subject required when not using a template (--subject)");
    Deno.exit(1);
  }

  if (!templateId && !textContent && !htmlContent) {
    output.error("Content required (--text, --html, --text-file, or --html-file)");
    Deno.exit(1);
  }

  const parseEmails = (emails: string[]): EmailAddress[] => {
    return emails.flatMap(e => e.split(",")).map(email => {
      const match = email.match(/^(.+?)\s*<(.+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: email.trim() };
    });
  };

  const toAddresses = parseEmails(toList);
  const ccAddresses = flags.cc ? parseEmails(flags.cc as string[]) : undefined;
  const bccAddresses = flags.bcc ? parseEmails(flags.bcc as string[]) : undefined;

  let dynamicTemplateData: Record<string, unknown> | undefined;
  if (flags.data) {
    try {
      dynamicTemplateData = JSON.parse(flags.data);
    } catch {
      output.error("Invalid JSON in --data");
      Deno.exit(1);
    }
  } else if (flags["data-file"]) {
    try {
      const dataContent = await Deno.readTextFile(flags["data-file"]);
      dynamicTemplateData = JSON.parse(dataContent);
    } catch {
      output.error(`Failed to read or parse --data-file`);
      Deno.exit(1);
    }
  }

  const personalization: Personalization = {
    to: toAddresses,
    cc: ccAddresses,
    bcc: bccAddresses,
    dynamic_template_data: dynamicTemplateData,
  };

  const from: EmailAddress = {
    email: fromEmail,
    name: flags["from-name"] || config.fromName,
  };

  const content: Content[] = [];
  if (textContent) content.push({ type: "text/plain", value: textContent });
  if (htmlContent) content.push({ type: "text/html", value: htmlContent });

  const attachments = [];
  if (flags.attachment) {
    for (const attachmentPath of flags.attachment as string[]) {
      try {
        const fileContent = await Deno.readFile(attachmentPath);
        const base64Content = btoa(String.fromCharCode(...fileContent));
        const filename = attachmentPath.split("/").pop() || "attachment";
        attachments.push({
          content: base64Content,
          filename,
        });
      } catch {
        output.error(`Failed to read attachment: ${attachmentPath}`);
        Deno.exit(1);
      }
    }
  }

  const replyTo = flags["reply-to"] ? { email: flags["reply-to"] } : undefined;
  const categories = flags.category as string[] | undefined;
  const sendAt = flags["send-at"] ? Math.floor(new Date(flags["send-at"]).getTime() / 1000) : undefined;
  const batchId = flags["batch-id"];

  const spin = output.spinner("Sending email...");
  const client = await SendGridClient.create();

  const result = await client.sendMail({
    personalizations: [personalization],
    from,
    reply_to: replyTo,
    subject: subject,
    content: content.length > 0 ? content : undefined,
    template_id: templateId,
    categories,
    send_at: sendAt,
    batch_id: batchId,
    attachments: attachments.length > 0 ? attachments : undefined,
    mail_settings: flags.sandbox ? { sandbox_mode: { enable: true } } : undefined,
  });

  spin.stop();

  if (!result.ok) {
    output.error(`Failed to send: ${result.errors?.[0]?.message || "Unknown error"}`);
    if (result.errors) {
      for (const err of result.errors) {
        if (err.field) output.info(`  Field: ${err.field}`);
        if (err.help) output.info(`  Help: ${err.help}`);
      }
    }
    Deno.exit(1);
  }

  if (flags.sandbox) {
    output.success("Email validated successfully (sandbox mode - not actually sent)");
  } else if (sendAt) {
    output.success(`Email scheduled for ${new Date(sendAt * 1000).toISOString()}`);
  } else {
    output.success(`Email sent to ${toAddresses.map(t => t.email).join(", ")}`);
  }
}

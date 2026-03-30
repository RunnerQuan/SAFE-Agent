import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const validateCommands = {
  email: {
    description: "Validate an email address",
    usage: "sendgrid validate email user@example.com",
    run: validateEmail,
  },
};

async function validateEmail(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["source"],
  });

  const email = flags._[0] as string;
  if (!email) {
    output.error("Email address required");
    output.info("Usage: sendgrid validate email user@example.com");
    Deno.exit(1);
  }

  const spin = output.spinner(`Validating ${email}...`);
  const client = await SendGridClient.create();
  const result = await client.validateEmail(email, flags.source);
  spin.stop();

  if (!result.ok) {
    output.error(`Validation failed: ${result.errors?.[0]?.message}`);
    output.info("Note: Email validation requires a Pro or Premier SendGrid plan");
    Deno.exit(1);
  }

  const validation = result.data!;
  
  const verdictColor = validation.verdict === "Valid" 
    ? "green" 
    : validation.verdict === "Risky" 
      ? "yellow" 
      : "red";

  output.heading(`Email Validation: ${email}`);
  
  const verdictDisplay = validation.verdict === "Valid" 
    ? `${validation.verdict}` 
    : validation.verdict === "Risky"
      ? `${validation.verdict}`
      : `${validation.verdict}`;

  output.keyValue([
    ["Verdict", verdictDisplay],
    ["Score", `${validation.score}/1.0`],
    ["Local Part", validation.local],
    ["Host", validation.host],
    ["Suggestion", validation.suggestion],
  ]);

  console.log("\nDomain Checks:");
  output.keyValue([
    ["Valid Syntax", validation.checks.domain.has_valid_address_syntax ? "Yes" : "No"],
    ["Has MX/A Record", validation.checks.domain.has_mx_or_a_record ? "Yes" : "No"],
    ["Disposable Address", validation.checks.domain.is_suspected_disposable_address ? "Yes" : "No"],
  ]);

  console.log("\nLocal Part Checks:");
  output.keyValue([
    ["Role Address", validation.checks.local_part.is_suspected_role_address ? "Yes" : "No"],
  ]);

  console.log("\nAdditional Checks:");
  output.keyValue([
    ["Known Bounces", validation.checks.additional.has_known_bounces ? "Yes" : "No"],
    ["Suspected Bounces", validation.checks.additional.has_suspected_bounces ? "Yes" : "No"],
  ]);

  if (validation.suggestion) {
    output.warn(`Did you mean: ${validation.suggestion}?`);
  }

  if (validation.verdict === "Invalid") {
    output.error("This email address appears to be invalid");
  } else if (validation.verdict === "Risky") {
    output.warn("This email address may have delivery issues");
  } else {
    output.success("This email address appears to be valid");
  }
}

import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient, type ContactInput } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const contactCommands = {
  add: {
    description: "Add or update a contact",
    usage: "sendgrid contact add --email user@example.com [--first-name John] [--last-name Doe]",
    run: contactAdd,
  },
  get: {
    description: "Get contact by ID or email",
    usage: "sendgrid contact get <id-or-email>",
    run: contactGet,
  },
  search: {
    description: "Search contacts",
    usage: "sendgrid contact search --query \"email LIKE '%@example.com'\"",
    run: contactSearch,
  },
  count: {
    description: "Get total contact count",
    usage: "sendgrid contact count",
    run: contactCount,
  },
  export: {
    description: "Export contacts",
    usage: "sendgrid contact export [--list-id <id>] [--output contacts.csv]",
    run: contactExport,
  },
  delete: {
    description: "Delete contacts",
    usage: "sendgrid contact delete <id1,id2,...> [--all]",
    run: contactDelete,
  },
};

async function contactAdd(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: [
      "email", "first-name", "last-name", "phone",
      "address", "address2", "city", "state", "zip", "country",
      "list-ids", "custom-fields",
    ],
    alias: {
      e: "email",
      f: "first-name",
      l: "last-name",
    },
  });

  if (!flags.email) {
    output.error("Email required (--email)");
    Deno.exit(1);
  }

  const contact: ContactInput = {
    email: flags.email,
    first_name: flags["first-name"],
    last_name: flags["last-name"],
    phone_number: flags.phone,
    address_line_1: flags.address,
    address_line_2: flags.address2,
    city: flags.city,
    state_province_region: flags.state,
    postal_code: flags.zip,
    country: flags.country,
  };

  if (flags["custom-fields"]) {
    try {
      contact.custom_fields = JSON.parse(flags["custom-fields"]);
    } catch {
      output.error("Invalid JSON in --custom-fields");
      Deno.exit(1);
    }
  }

  const listIds = flags["list-ids"]?.split(",");

  const client = await SendGridClient.create();
  const result = await client.addContacts([contact], listIds);

  if (!result.ok) {
    output.error(`Failed to add contact: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Contact added/updated: ${flags.email}`);
  output.info(`Job ID: ${result.data!.job_id}`);
}

async function contactGet(args: string[]): Promise<void> {
  const idOrEmail = args[0];
  if (!idOrEmail) {
    output.error("Contact ID or email required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  
  let contact;
  if (idOrEmail.includes("@")) {
    const result = await client.getContactByEmail(idOrEmail);
    if (!result.ok) {
      output.error(`Failed to get contact: ${result.errors?.[0]?.message}`);
      Deno.exit(1);
    }
    contact = result.data?.result?.[idOrEmail];
    if (!contact) {
      output.error(`Contact not found: ${idOrEmail}`);
      Deno.exit(1);
    }
  } else {
    const result = await client.getContact(idOrEmail);
    if (!result.ok) {
      output.error(`Failed to get contact: ${result.errors?.[0]?.message}`);
      Deno.exit(1);
    }
    contact = result.data!;
  }

  output.heading(contact.email);
  output.keyValue([
    ["ID", contact.id],
    ["Email", contact.email],
    ["First Name", contact.first_name],
    ["Last Name", contact.last_name],
    ["Phone", contact.phone_number],
    ["City", contact.city],
    ["State", contact.state_province_region],
    ["Country", contact.country],
    ["Created", contact.created_at ? new Date(contact.created_at).toLocaleString() : undefined],
    ["Updated", contact.updated_at ? new Date(contact.updated_at).toLocaleString() : undefined],
  ]);

  if (contact.list_ids?.length) {
    console.log("\nLists:", contact.list_ids.join(", "));
  }
}

async function contactSearch(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["query"],
    alias: { q: "query" },
  });

  if (!flags.query) {
    output.error("Query required (--query)");
    output.info("Example: --query \"email LIKE '%@example.com'\"");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.searchContacts(flags.query);

  if (!result.ok) {
    output.error(`Search failed: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const contacts = result.data?.result || [];
  output.info(`Found ${result.data?.contact_count || contacts.length} contacts`);

  if (contacts.length === 0) return;

  output.table(
    ["ID", "Email", "First Name", "Last Name"],
    contacts.slice(0, 50).map(c => [
      c.id,
      c.email,
      c.first_name || "",
      c.last_name || "",
    ])
  );

  if (contacts.length > 50) {
    output.info(`... and ${contacts.length - 50} more`);
  }
}

async function contactCount(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.getContactCount();

  if (!result.ok) {
    output.error(`Failed to get count: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.keyValue([
    ["Total Contacts", String(result.data!.contact_count)],
    ["Billable Contacts", String(result.data!.billable_count)],
  ]);
}

async function contactExport(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["list-id", "segment-id", "output"],
    alias: { o: "output" },
  });

  const client = await SendGridClient.create();
  
  const listIds = flags["list-id"]?.split(",");
  const segmentIds = flags["segment-id"]?.split(",");

  const spin = output.spinner("Starting export...");
  const result = await client.exportContacts(listIds, segmentIds);

  if (!result.ok) {
    spin.stop();
    output.error(`Failed to start export: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const exportId = result.data!.id;
  spin.stop();
  output.info(`Export started: ${exportId}`);

  let status = "pending";
  while (status === "pending") {
    await new Promise(r => setTimeout(r, 2000));
    const statusResult = await client.getExportStatus(exportId);
    if (statusResult.ok) {
      status = statusResult.data!.status;
      if (status === "ready" && statusResult.data?.urls) {
        output.success("Export ready!");
        for (const url of statusResult.data.urls) {
          output.info(`Download: ${url}`);
        }
        if (statusResult.data.contact_count) {
          output.info(`Contacts: ${statusResult.data.contact_count}`);
        }
      } else if (status === "failure") {
        output.error(`Export failed: ${statusResult.data?.message}`);
        Deno.exit(1);
      } else {
        output.info(`Status: ${status}...`);
      }
    }
  }
}

async function contactDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["all", "force"],
    alias: { f: "force", y: "force" },
  });

  const ids = (flags._[0] as string)?.split(",");

  if (!flags.all && (!ids || ids.length === 0)) {
    output.error("Contact IDs required, or use --all to delete all contacts");
    Deno.exit(1);
  }

  if (flags.all && !flags.force) {
    const confirm = prompt("Delete ALL contacts? This cannot be undone! [y/N]");
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteContacts(flags.all ? undefined : ids, flags.all);

  if (!result.ok) {
    output.error(`Failed to delete: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(flags.all ? "All contacts deletion started" : `Deletion started for ${ids?.length} contacts`);
  output.info(`Job ID: ${result.data!.job_id}`);
}

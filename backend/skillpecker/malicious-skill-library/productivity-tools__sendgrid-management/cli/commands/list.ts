import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const listCommands = {
  all: {
    description: "List all contact lists",
    usage: "sendgrid list all",
    run: listAll,
  },
  get: {
    description: "Get list details",
    usage: "sendgrid list get <list-id>",
    run: listGet,
  },
  create: {
    description: "Create a new list",
    usage: "sendgrid list create --name 'Newsletter Subscribers'",
    run: listCreate,
  },
  update: {
    description: "Update list name",
    usage: "sendgrid list update <list-id> --name 'New Name'",
    run: listUpdate,
  },
  delete: {
    description: "Delete a list",
    usage: "sendgrid list delete <list-id> [--delete-contacts]",
    run: listDelete,
  },
  count: {
    description: "Get contact count for a list",
    usage: "sendgrid list count <list-id>",
    run: listCount,
  },
  "remove-contacts": {
    description: "Remove contacts from a list",
    usage: "sendgrid list remove-contacts <list-id> --contact-ids id1,id2",
    run: listRemoveContacts,
  },
};

async function listAll(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["page-size"],
  });

  const client = await SendGridClient.create();
  const result = await client.listLists({
    page_size: flags["page-size"] ? parseInt(flags["page-size"]) : 100,
  });

  if (!result.ok) {
    output.error(`Failed to list: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const lists = result.data?.result || [];
  
  if (lists.length === 0) {
    output.info("No lists found");
    return;
  }

  output.table(
    ["ID", "Name", "Contacts"],
    lists.map(l => [l.id, l.name, String(l.contact_count)])
  );

  if (result.data?._metadata?.count) {
    output.info(`Total lists: ${result.data._metadata.count}`);
  }
}

async function listGet(args: string[]): Promise<void> {
  const listId = args[0];
  if (!listId) {
    output.error("List ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getList(listId, { contact_sample: true });

  if (!result.ok) {
    output.error(`Failed to get list: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const list = result.data!;
  output.heading(list.name);
  output.keyValue([
    ["ID", list.id],
    ["Name", list.name],
    ["Contact Count", String(list.contact_count)],
  ]);
}

async function listCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name"],
    alias: { n: "name" },
  });

  if (!flags.name) {
    output.error("List name required (--name)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.createList(flags.name);

  if (!result.ok) {
    output.error(`Failed to create list: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`List created: ${result.data!.name}`);
  output.info(`ID: ${result.data!.id}`);
}

async function listUpdate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name"],
    alias: { n: "name" },
  });

  const listId = flags._[0] as string;
  if (!listId) {
    output.error("List ID required");
    Deno.exit(1);
  }

  if (!flags.name) {
    output.error("New name required (--name)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.updateList(listId, flags.name);

  if (!result.ok) {
    output.error(`Failed to update list: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`List updated: ${result.data!.name}`);
}

async function listDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["delete-contacts", "force"],
    alias: { f: "force", y: "force" },
  });

  const listId = flags._[0] as string;
  if (!listId) {
    output.error("List ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const msg = flags["delete-contacts"]
      ? `Delete list ${listId} AND all its contacts?`
      : `Delete list ${listId}?`;
    const confirm = prompt(`${msg} [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteList(listId, flags["delete-contacts"]);

  if (!result.ok) {
    output.error(`Failed to delete list: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("List deleted");
}

async function listCount(args: string[]): Promise<void> {
  const listId = args[0];
  if (!listId) {
    output.error("List ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getListContactCount(listId);

  if (!result.ok) {
    output.error(`Failed to get count: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.keyValue([
    ["Contact Count", String(result.data!.contact_count)],
    ["Billable Count", String(result.data!.billable_count)],
  ]);
}

async function listRemoveContacts(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["contact-ids"],
    alias: { c: "contact-ids" },
  });

  const listId = flags._[0] as string;
  if (!listId) {
    output.error("List ID required");
    Deno.exit(1);
  }

  if (!flags["contact-ids"]) {
    output.error("Contact IDs required (--contact-ids id1,id2,...)");
    Deno.exit(1);
  }

  const contactIds = flags["contact-ids"].split(",");

  const client = await SendGridClient.create();
  const result = await client.removeContactsFromList(listId, contactIds);

  if (!result.ok) {
    output.error(`Failed to remove contacts: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Removal started for ${contactIds.length} contacts`);
  output.info(`Job ID: ${result.data!.job_id}`);
}

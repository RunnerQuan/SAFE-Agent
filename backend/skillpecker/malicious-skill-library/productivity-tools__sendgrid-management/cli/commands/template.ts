import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const templateCommands = {
  list: {
    description: "List all templates",
    usage: "sendgrid template list [--generation dynamic|legacy]",
    run: templateList,
  },
  get: {
    description: "Get template details",
    usage: "sendgrid template get <template-id>",
    run: templateGet,
  },
  create: {
    description: "Create a new template",
    usage: "sendgrid template create --name 'My Template' [--generation dynamic]",
    run: templateCreate,
  },
  update: {
    description: "Update a template name",
    usage: "sendgrid template update <template-id> --name 'New Name'",
    run: templateUpdate,
  },
  delete: {
    description: "Delete a template",
    usage: "sendgrid template delete <template-id> [--force]",
    run: templateDelete,
  },
  "version-create": {
    description: "Create a template version",
    usage: "sendgrid template version-create <template-id> --name 'v1' --subject 'Subject' --html-file template.html",
    run: templateVersionCreate,
  },
  "version-activate": {
    description: "Activate a template version",
    usage: "sendgrid template version-activate <template-id> <version-id>",
    run: templateVersionActivate,
  },
};

async function templateList(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["generation", "page-size"],
    alias: { g: "generation" },
  });

  const client = await SendGridClient.create();
  const params: { generations?: "legacy" | "dynamic"; page_size?: number } = {};
  
  if (flags.generation === "legacy" || flags.generation === "dynamic") {
    params.generations = flags.generation;
  }
  if (flags["page-size"]) {
    params.page_size = parseInt(flags["page-size"]);
  }

  const result = await client.listTemplates(params);

  if (!result.ok) {
    output.error(`Failed to list templates: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const templates = result.data?.templates || result.data?.result || [];
  
  if (templates.length === 0) {
    output.info("No templates found");
    return;
  }

  output.table(
    ["ID", "Name", "Generation", "Updated"],
    templates.map(t => [
      t.id,
      t.name,
      t.generation,
      new Date(t.updated_at).toLocaleDateString(),
    ])
  );
}

async function templateGet(args: string[]): Promise<void> {
  const templateId = args[0];
  if (!templateId) {
    output.error("Template ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getTemplate(templateId);

  if (!result.ok) {
    output.error(`Failed to get template: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const template = result.data!;
  output.heading(template.name);
  output.keyValue([
    ["ID", template.id],
    ["Generation", template.generation],
    ["Updated", new Date(template.updated_at).toLocaleString()],
  ]);

  if (template.versions && template.versions.length > 0) {
    console.log("\nVersions:");
    output.table(
      ["ID", "Name", "Subject", "Active", "Updated"],
      template.versions.map(v => [
        v.id,
        v.name,
        v.subject || "(none)",
        v.active === 1 ? "Yes" : "No",
        new Date(v.updated_at).toLocaleDateString(),
      ])
    );
  }
}

async function templateCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name", "generation"],
    alias: { n: "name", g: "generation" },
  });

  if (!flags.name) {
    output.error("Template name required (--name)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.createTemplate({
    name: flags.name,
    generation: (flags.generation as "legacy" | "dynamic") || "dynamic",
  });

  if (!result.ok) {
    output.error(`Failed to create template: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Template created: ${result.data!.name}`);
  output.info(`ID: ${result.data!.id}`);
}

async function templateUpdate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name"],
    alias: { n: "name" },
  });

  const templateId = flags._[0] as string;
  if (!templateId) {
    output.error("Template ID required");
    Deno.exit(1);
  }

  if (!flags.name) {
    output.error("New name required (--name)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.updateTemplate(templateId, { name: flags.name });

  if (!result.ok) {
    output.error(`Failed to update template: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Template updated: ${result.data!.name}`);
}

async function templateDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["force"],
    alias: { f: "force", y: "force" },
  });

  const templateId = flags._[0] as string;
  if (!templateId) {
    output.error("Template ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const confirm = prompt(`Delete template ${templateId}? [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteTemplate(templateId);

  if (!result.ok) {
    output.error(`Failed to delete template: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Template deleted");
}

async function templateVersionCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["name", "subject", "html", "html-file", "plain", "plain-file", "test-data"],
    boolean: ["active"],
    alias: { n: "name", s: "subject" },
  });

  const templateId = flags._[0] as string;
  if (!templateId) {
    output.error("Template ID required");
    Deno.exit(1);
  }

  if (!flags.name) {
    output.error("Version name required (--name)");
    Deno.exit(1);
  }

  let htmlContent = flags.html;
  if (flags["html-file"]) {
    htmlContent = await Deno.readTextFile(flags["html-file"]);
  }

  let plainContent = flags.plain;
  if (flags["plain-file"]) {
    plainContent = await Deno.readTextFile(flags["plain-file"]);
  }

  const client = await SendGridClient.create();
  const result = await client.createTemplateVersion(templateId, {
    name: flags.name,
    subject: flags.subject,
    html_content: htmlContent,
    plain_content: plainContent,
    active: flags.active ? 1 : 0,
    test_data: flags["test-data"],
  });

  if (!result.ok) {
    output.error(`Failed to create version: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Version created: ${result.data!.name}`);
  output.info(`ID: ${result.data!.id}`);
}

async function templateVersionActivate(args: string[]): Promise<void> {
  const [templateId, versionId] = args;

  if (!templateId || !versionId) {
    output.error("Template ID and version ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.activateTemplateVersion(templateId, versionId);

  if (!result.ok) {
    output.error(`Failed to activate version: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Version ${versionId} is now active`);
}

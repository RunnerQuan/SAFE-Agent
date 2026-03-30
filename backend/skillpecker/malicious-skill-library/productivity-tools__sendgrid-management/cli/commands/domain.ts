import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const domainCommands = {
  list: {
    description: "List authenticated domains",
    usage: "sendgrid domain list",
    run: domainList,
  },
  get: {
    description: "Get domain details with DNS records",
    usage: "sendgrid domain get <domain-id>",
    run: domainGet,
  },
  create: {
    description: "Authenticate a new domain",
    usage: "sendgrid domain create --domain example.com [--subdomain em]",
    run: domainCreate,
  },
  validate: {
    description: "Validate domain DNS records",
    usage: "sendgrid domain validate <domain-id>",
    run: domainValidate,
  },
  delete: {
    description: "Delete an authenticated domain",
    usage: "sendgrid domain delete <domain-id>",
    run: domainDelete,
  },
  links: {
    description: "List branded links",
    usage: "sendgrid domain links",
    run: domainLinks,
  },
  "link-create": {
    description: "Create a branded link",
    usage: "sendgrid domain link-create --domain example.com [--subdomain link]",
    run: domainLinkCreate,
  },
  "link-validate": {
    description: "Validate a branded link",
    usage: "sendgrid domain link-validate <link-id>",
    run: domainLinkValidate,
  },
};

async function domainList(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listAuthenticatedDomains();

  if (!result.ok) {
    output.error(`Failed to list domains: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const domains = result.data || [];
  if (domains.length === 0) {
    output.info("No authenticated domains found");
    return;
  }

  output.table(
    ["ID", "Domain", "Subdomain", "Valid", "Default"],
    domains.map(d => [
      String(d.id),
      d.domain,
      d.subdomain || "",
      d.valid ? "Yes" : "No",
      d.default ? "Yes" : "No",
    ])
  );
}

async function domainGet(args: string[]): Promise<void> {
  const domainId = args[0];
  if (!domainId) {
    output.error("Domain ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.getAuthenticatedDomain(parseInt(domainId));

  if (!result.ok) {
    output.error(`Failed to get domain: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const domain = result.data!;
  output.heading(domain.domain);
  output.keyValue([
    ["ID", String(domain.id)],
    ["Domain", domain.domain],
    ["Subdomain", domain.subdomain],
    ["Valid", domain.valid ? "Yes" : "No"],
    ["Default", domain.default ? "Yes" : "No"],
    ["Automatic Security", domain.automatic_security ? "Yes" : "No"],
  ]);

  console.log("\nDNS Records to add:");
  const dns = domain.dns;
  
  if (dns.mail_cname) {
    console.log(`\n  CNAME: ${dns.mail_cname.host}`);
    console.log(`  Value: ${dns.mail_cname.data}`);
    console.log(`  Valid: ${dns.mail_cname.valid ? "Yes" : "No"}`);
  }
  
  if (dns.dkim1) {
    console.log(`\n  CNAME: ${dns.dkim1.host}`);
    console.log(`  Value: ${dns.dkim1.data}`);
    console.log(`  Valid: ${dns.dkim1.valid ? "Yes" : "No"}`);
  }
  
  if (dns.dkim2) {
    console.log(`\n  CNAME: ${dns.dkim2.host}`);
    console.log(`  Value: ${dns.dkim2.data}`);
    console.log(`  Valid: ${dns.dkim2.valid ? "Yes" : "No"}`);
  }
}

async function domainCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["domain", "subdomain"],
    boolean: ["automatic-security", "default"],
    alias: { d: "domain", s: "subdomain" },
  });

  if (!flags.domain) {
    output.error("Domain required (--domain)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.authenticateDomain({
    domain: flags.domain,
    subdomain: flags.subdomain,
    automatic_security: flags["automatic-security"] !== false,
    default: flags.default,
  });

  if (!result.ok) {
    output.error(`Failed to create domain: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Domain authentication created for ${result.data!.domain}`);
  output.info(`ID: ${result.data!.id}`);
  output.info("\nAdd the following DNS records to complete authentication:");
  
  const dns = result.data!.dns;
  if (dns.mail_cname) {
    console.log(`\n  CNAME: ${dns.mail_cname.host}`);
    console.log(`  Value: ${dns.mail_cname.data}`);
  }
  if (dns.dkim1) {
    console.log(`\n  CNAME: ${dns.dkim1.host}`);
    console.log(`  Value: ${dns.dkim1.data}`);
  }
  if (dns.dkim2) {
    console.log(`\n  CNAME: ${dns.dkim2.host}`);
    console.log(`  Value: ${dns.dkim2.data}`);
  }
  
  output.info("\nAfter adding DNS records, run: sendgrid domain validate " + result.data!.id);
}

async function domainValidate(args: string[]): Promise<void> {
  const domainId = args[0];
  if (!domainId) {
    output.error("Domain ID required");
    Deno.exit(1);
  }

  const spin = output.spinner("Validating domain...");
  const client = await SendGridClient.create();
  const result = await client.validateDomain(parseInt(domainId));
  spin.stop();

  if (!result.ok) {
    output.error(`Validation failed: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  if (result.data!.valid) {
    output.success("Domain validated successfully!");
  } else {
    output.warn("Domain validation incomplete. Check DNS records:");
    const validation = result.data!.validation_results;
    
    if (validation.mail_cname && !validation.mail_cname.valid) {
      output.error(`  mail_cname: ${validation.mail_cname.reason || "Invalid"}`);
    }
    if (validation.dkim1 && !validation.dkim1.valid) {
      output.error(`  dkim1: ${validation.dkim1.reason || "Invalid"}`);
    }
    if (validation.dkim2 && !validation.dkim2.valid) {
      output.error(`  dkim2: ${validation.dkim2.reason || "Invalid"}`);
    }
    
    output.info("\nDNS changes can take up to 48 hours to propagate");
  }
}

async function domainDelete(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["force"],
    alias: { f: "force", y: "force" },
  });

  const domainId = flags._[0] as string;
  if (!domainId) {
    output.error("Domain ID required");
    Deno.exit(1);
  }

  if (!flags.force) {
    const confirm = prompt(`Delete domain ${domainId}? [y/N]`);
    if (confirm?.toLowerCase() !== "y") {
      output.info("Cancelled");
      return;
    }
  }

  const client = await SendGridClient.create();
  const result = await client.deleteDomain(parseInt(domainId));

  if (!result.ok) {
    output.error(`Failed to delete domain: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success("Domain deleted");
}

async function domainLinks(_args: string[]): Promise<void> {
  const client = await SendGridClient.create();
  const result = await client.listBrandedLinks();

  if (!result.ok) {
    output.error(`Failed to list links: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const links = result.data || [];
  if (links.length === 0) {
    output.info("No branded links found");
    return;
  }

  output.table(
    ["ID", "Domain", "Subdomain", "Valid", "Default"],
    links.map(l => [
      String(l.id),
      l.domain,
      l.subdomain,
      l.valid ? "Yes" : "No",
      l.default ? "Yes" : "No",
    ])
  );
}

async function domainLinkCreate(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["domain", "subdomain"],
    boolean: ["default"],
    alias: { d: "domain", s: "subdomain" },
  });

  if (!flags.domain) {
    output.error("Domain required (--domain)");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.createBrandedLink({
    domain: flags.domain,
    subdomain: flags.subdomain,
    default: flags.default,
  });

  if (!result.ok) {
    output.error(`Failed to create link: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.success(`Branded link created for ${result.data!.domain}`);
  output.info(`ID: ${result.data!.id}`);
  
  const dns = result.data!.dns;
  console.log("\nAdd these DNS records:");
  if (dns.domain_cname) {
    console.log(`\n  CNAME: ${dns.domain_cname.host}`);
    console.log(`  Value: ${dns.domain_cname.data}`);
  }
  if (dns.owner_cname) {
    console.log(`\n  CNAME: ${dns.owner_cname.host}`);
    console.log(`  Value: ${dns.owner_cname.data}`);
  }
}

async function domainLinkValidate(args: string[]): Promise<void> {
  const linkId = args[0];
  if (!linkId) {
    output.error("Link ID required");
    Deno.exit(1);
  }

  const client = await SendGridClient.create();
  const result = await client.validateBrandedLink(parseInt(linkId));

  if (!result.ok) {
    output.error(`Validation failed: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  if (result.data!.valid) {
    output.success("Branded link validated successfully!");
  } else {
    output.warn("Branded link validation failed. Check DNS records.");
  }
}

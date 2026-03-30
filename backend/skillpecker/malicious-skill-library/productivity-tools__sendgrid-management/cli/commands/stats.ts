import { parseArgs } from "@std/cli/parse-args";
import { SendGridClient } from "../lib/client.ts";
import * as output from "../lib/output.ts";

export const statsCommands = {
  global: {
    description: "Get global email statistics",
    usage: "sendgrid stats global --days 7",
    run: statsGlobal,
  },
  category: {
    description: "Get stats by category",
    usage: "sendgrid stats category --categories cat1,cat2 --days 30",
    run: statsCategory,
  },
  browsers: {
    description: "Get stats by browser",
    usage: "sendgrid stats browsers --days 7",
    run: statsBrowsers,
  },
  devices: {
    description: "Get stats by device",
    usage: "sendgrid stats devices --days 7",
    run: statsDevices,
  },
  "mailbox-providers": {
    description: "Get stats by mailbox provider",
    usage: "sendgrid stats mailbox-providers --days 7",
    run: statsMailboxProviders,
  },
  geo: {
    description: "Get stats by geography",
    usage: "sendgrid stats geo --days 7",
    run: statsGeo,
  },
};

function getDateRange(args: string[]) {
  const flags = parseArgs(args, {
    string: ["start-date", "end-date", "days", "aggregated-by"],
    alias: { d: "days" },
  });

  let startDate: string;
  let endDate: string;

  if (flags["start-date"]) {
    startDate = flags["start-date"];
    endDate = flags["end-date"] || new Date().toISOString().split("T")[0];
  } else {
    const days = parseInt(flags.days || "7");
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    startDate = start.toISOString().split("T")[0];
    endDate = end.toISOString().split("T")[0];
  }

  return {
    start_date: startDate,
    end_date: endDate,
    aggregated_by: flags["aggregated-by"] as "day" | "week" | "month" | undefined,
  };
}

function displayStats(stats: Array<{ date: string; stats: Array<{ metrics: Record<string, number | undefined>; name?: string; type?: string }> }>) {
  if (stats.length === 0) {
    output.info("No stats available for this period");
    return;
  }

  const totals = {
    requests: 0,
    delivered: 0,
    opens: 0,
    unique_opens: 0,
    clicks: 0,
    unique_clicks: 0,
    bounces: 0,
    spam_reports: 0,
    unsubscribes: 0,
  };

  for (const day of stats) {
    for (const stat of day.stats) {
      const m = stat.metrics;
      totals.requests += m.requests || 0;
      totals.delivered += m.delivered || 0;
      totals.opens += m.opens || 0;
      totals.unique_opens += m.unique_opens || 0;
      totals.clicks += m.clicks || 0;
      totals.unique_clicks += m.unique_clicks || 0;
      totals.bounces += m.bounces || 0;
      totals.spam_reports += m.spam_reports || 0;
      totals.unsubscribes += m.unsubscribes || 0;
    }
  }

  const deliveryRate = totals.requests > 0 ? ((totals.delivered / totals.requests) * 100).toFixed(1) : "0";
  const openRate = totals.delivered > 0 ? ((totals.unique_opens / totals.delivered) * 100).toFixed(1) : "0";
  const clickRate = totals.delivered > 0 ? ((totals.unique_clicks / totals.delivered) * 100).toFixed(1) : "0";

  output.heading("Summary");
  output.keyValue([
    ["Requests", String(totals.requests)],
    ["Delivered", `${totals.delivered} (${deliveryRate}%)`],
    ["Opens", `${totals.opens} (${totals.unique_opens} unique, ${openRate}% rate)`],
    ["Clicks", `${totals.clicks} (${totals.unique_clicks} unique, ${clickRate}% rate)`],
    ["Bounces", String(totals.bounces)],
    ["Spam Reports", String(totals.spam_reports)],
    ["Unsubscribes", String(totals.unsubscribes)],
  ]);

  if (stats.length <= 14) {
    console.log("\nDaily Breakdown:");
    output.table(
      ["Date", "Sent", "Delivered", "Opens", "Clicks", "Bounces"],
      stats.map(day => {
        const m = day.stats[0]?.metrics || {};
        return [
          day.date,
          String(m.requests || 0),
          String(m.delivered || 0),
          String(m.opens || 0),
          String(m.clicks || 0),
          String(m.bounces || 0),
        ];
      })
    );
  }
}

async function statsGlobal(args: string[]): Promise<void> {
  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getGlobalStats(params);

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.info(`Stats from ${params.start_date} to ${params.end_date}`);
  displayStats(result.data || []);
}

async function statsCategory(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    string: ["categories"],
    alias: { c: "categories" },
  });

  if (!flags.categories) {
    output.error("Categories required (--categories cat1,cat2)");
    Deno.exit(1);
  }

  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getCategoryStats({
    ...params,
    categories: flags.categories,
  });

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  output.info(`Category stats from ${params.start_date} to ${params.end_date}`);
  displayStats(result.data || []);
}

async function statsBrowsers(args: string[]): Promise<void> {
  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getBrowserStats(params);

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const stats = result.data || [];
  if (stats.length === 0) {
    output.info("No browser stats available");
    return;
  }

  const browsers: Record<string, number> = {};
  for (const day of stats) {
    for (const stat of day.stats) {
      if (stat.name) {
        browsers[stat.name] = (browsers[stat.name] || 0) + (stat.metrics.clicks || 0);
      }
    }
  }

  output.heading("Browser Stats");
  output.table(
    ["Browser", "Clicks"],
    Object.entries(browsers)
      .sort((a, b) => b[1] - a[1])
      .map(([name, clicks]) => [name, String(clicks)])
  );
}

async function statsDevices(args: string[]): Promise<void> {
  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getDeviceStats(params);

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const stats = result.data || [];
  if (stats.length === 0) {
    output.info("No device stats available");
    return;
  }

  const devices: Record<string, number> = {};
  for (const day of stats) {
    for (const stat of day.stats) {
      if (stat.name) {
        devices[stat.name] = (devices[stat.name] || 0) + (stat.metrics.opens || 0);
      }
    }
  }

  output.heading("Device Stats");
  output.table(
    ["Device", "Opens"],
    Object.entries(devices)
      .sort((a, b) => b[1] - a[1])
      .map(([name, opens]) => [name, String(opens)])
  );
}

async function statsMailboxProviders(args: string[]): Promise<void> {
  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getMailboxProviderStats(params);

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const stats = result.data || [];
  if (stats.length === 0) {
    output.info("No mailbox provider stats available");
    return;
  }

  const providers: Record<string, { delivered: number; bounces: number }> = {};
  for (const day of stats) {
    for (const stat of day.stats) {
      if (stat.name) {
        if (!providers[stat.name]) {
          providers[stat.name] = { delivered: 0, bounces: 0 };
        }
        providers[stat.name].delivered += stat.metrics.delivered || 0;
        providers[stat.name].bounces += stat.metrics.bounces || 0;
      }
    }
  }

  output.heading("Mailbox Provider Stats");
  output.table(
    ["Provider", "Delivered", "Bounces"],
    Object.entries(providers)
      .sort((a, b) => b[1].delivered - a[1].delivered)
      .slice(0, 20)
      .map(([name, stats]) => [name, String(stats.delivered), String(stats.bounces)])
  );
}

async function statsGeo(args: string[]): Promise<void> {
  const params = getDateRange(args);
  const client = await SendGridClient.create();
  const result = await client.getGeoStats(params);

  if (!result.ok) {
    output.error(`Failed to get stats: ${result.errors?.[0]?.message}`);
    Deno.exit(1);
  }

  const stats = result.data || [];
  if (stats.length === 0) {
    output.info("No geographic stats available");
    return;
  }

  const countries: Record<string, number> = {};
  for (const day of stats) {
    for (const stat of day.stats) {
      if (stat.name) {
        countries[stat.name] = (countries[stat.name] || 0) + (stat.metrics.opens || 0);
      }
    }
  }

  output.heading("Geographic Stats (by opens)");
  output.table(
    ["Country", "Opens"],
    Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, opens]) => [name, String(opens)])
  );
}

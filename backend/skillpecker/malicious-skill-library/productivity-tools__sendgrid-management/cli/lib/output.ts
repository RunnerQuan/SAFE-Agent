import { bold, cyan, dim, green, red, yellow } from "@std/fmt/colors";

export type OutputFormat = "table" | "json" | "plain";

let currentFormat: OutputFormat = "table";

export function setOutputFormat(format: OutputFormat): void {
  currentFormat = format;
}

export function getOutputFormat(): OutputFormat {
  return currentFormat;
}

export function success(message: string): void {
  console.log(green("✓") + " " + message);
}

export function error(message: string): void {
  console.error(red("✗") + " " + message);
}

export function warn(message: string): void {
  console.log(yellow("⚠") + " " + message);
}

export function info(message: string): void {
  console.log(cyan("ℹ") + " " + message);
}

export function heading(text: string): void {
  console.log("\n" + bold(text));
  console.log(dim("─".repeat(text.length)));
}

export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function table(
  headers: string[],
  rows: string[][],
  options: { maxWidth?: number } = {}
): void {
  if (currentFormat === "json") {
    const objects = rows.map((row) =>
      headers.reduce((obj, header, i) => {
        obj[header] = row[i];
        return obj;
      }, {} as Record<string, string>)
    );
    json(objects);
    return;
  }

  const maxWidth = options.maxWidth ?? 50;
  const colWidths = headers.map((h, i) =>
    Math.min(
      maxWidth,
      Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
    )
  );

  const formatRow = (row: string[]): string =>
    row.map((cell, i) => (cell || "").padEnd(colWidths[i])).join("  ");

  console.log(dim(formatRow(headers)));
  console.log(dim(colWidths.map((w) => "─".repeat(w)).join("  ")));
  rows.forEach((row) => console.log(formatRow(row)));
}

export function keyValue(pairs: [string, string | undefined][]): void {
  if (currentFormat === "json") {
    const obj = Object.fromEntries(pairs.filter(([, v]) => v !== undefined));
    json(obj);
    return;
  }

  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length));
  for (const [key, value] of pairs) {
    if (value !== undefined) {
      console.log(`${dim(key.padEnd(maxKeyLen))}  ${value}`);
    }
  }
}

export function list(items: string[], bullet = "•"): void {
  items.forEach((item) => console.log(`  ${dim(bullet)} ${item}`));
}

export function spinner(message: string): { stop: (finalMessage?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const interval = setInterval(() => {
    Deno.stdout.writeSync(
      new TextEncoder().encode(`\r${cyan(frames[i++ % frames.length])} ${message}`)
    );
  }, 80);

  return {
    stop: (finalMessage?: string) => {
      clearInterval(interval);
      Deno.stdout.writeSync(new TextEncoder().encode("\r" + " ".repeat(message.length + 4) + "\r"));
      if (finalMessage) {
        console.log(finalMessage);
      }
    },
  };
}

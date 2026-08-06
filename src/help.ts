import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { FlagSet } from "./types.js";

/** Long flags and standalone short flags from --help text. */
const HELP_LONG = /(?:^|[\s,|[/])(--[a-zA-Z][\w-]*)/g;
const HELP_SHORT = /(?:^|[\s,|[/])(-[a-zA-Z])(?![a-zA-Z0-9-])/g;

/** Flags that almost every CLI documents; still counted if present. */
const NOISE = new Set(["--"]);

/**
 * Parse flag tokens from a --help dump.
 * Prefers long forms; keeps short forms that appear without a paired long flag on the same line.
 */
export function extractFlagsFromHelp(helpText: string): FlagSet {
  const flags = new Set<string>();
  const raw: string[] = [];

  for (const line of helpText.split(/\r?\n/)) {
    const longs: string[] = [];
    const shorts: string[] = [];

    for (const m of line.matchAll(HELP_LONG)) {
      const f = m[1];
      if (!f || NOISE.has(f)) continue;
      longs.push(f);
    }
    for (const m of line.matchAll(HELP_SHORT)) {
      const f = m[1];
      if (f) shorts.push(f);
    }

    if (longs.length > 0) {
      for (const f of longs) {
        flags.add(f);
        raw.push(f);
      }
    } else {
      for (const f of shorts) {
        flags.add(f);
        raw.push(f);
      }
    }
  }

  return { flags, raw: [...new Set(raw)].sort() };
}

function isNodeScript(filePath: string): boolean {
  if (/\.[cm]?js$/i.test(filePath)) return true;
  try {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 200);
    return /^#!.*\b(?:node|nodejs)\b/m.test(head);
  } catch {
    return false;
  }
}

export function runHelp(binPath: string, cwd: string): { text: string; error?: string } {
  const resolved = path.isAbsolute(binPath) ? binPath : path.resolve(cwd, binPath);
  if (!fs.existsSync(resolved)) {
    return { text: "", error: `Binary not found: ${resolved}` };
  }

  const result = isNodeScript(resolved)
    ? spawnSync(process.execPath, [resolved, "--help"], {
        cwd,
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
        timeout: 15_000,
      })
    : spawnSync(resolved, ["--help"], {
        cwd,
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
        timeout: 15_000,
      });

  // Many CLIs print help to stdout; some to stderr. Merge both.
  const text = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (!text.trim() && result.error) {
    return { text: "", error: `Failed to run ${resolved} --help: ${result.error.message}` };
  }
  if (!text.trim()) {
    return {
      text: "",
      error: `No --help output from ${resolved} (exit ${result.status ?? "?"})`,
    };
  }

  return { text };
}

/** Resolve package.json "bin" field to a relative path. */
export function resolvePackageBin(cwd: string): { bin?: string; error?: string } {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { error: `No package.json in ${cwd}; pass --bin explicitly` };
  }

  let pkg: { name?: string; bin?: string | Record<string, string> };
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      name?: string;
      bin?: string | Record<string, string>;
    };
  } catch (e) {
    return { error: `Invalid package.json: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!pkg.bin) {
    return { error: `package.json has no "bin" field; pass --bin explicitly` };
  }

  if (typeof pkg.bin === "string") {
    return { bin: pkg.bin };
  }

  const entries = Object.entries(pkg.bin);
  if (entries.length === 0) {
    return { error: `package.json "bin" is empty; pass --bin explicitly` };
  }

  // Prefer bin matching package name, else first entry.
  const byName = pkg.name ? entries.find(([name]) => name === pkg.name) : undefined;
  const chosen = byName ?? entries[0];
  if (!chosen) {
    return { error: `Could not resolve bin from package.json` };
  }
  return { bin: chosen[1] };
}

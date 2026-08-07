import type { CliOptions, ParseArgsResult } from "./types.js";

const VERSION = "0.1.0";

export function getVersion(): string {
  return VERSION;
}

export function printOwnHelp(): void {
  console.log(`helpgate — assert README flags match live --help

Usage:
  helpgate [--bin path] [--help-cmd arg…] [--readme path] [--cwd dir] [--allow flag] [--strict-scripts] [--no-scripts] [--quiet] [--summary] [--exit-zero] [--json]

Options:
  --bin <path>       Executable to run with --help (default: resolve from package.json bin)
  --help-cmd <arg>   Args for help invocation (repeatable; default: --help). Example: --help-cmd -h
  --readme <path>    README to scan (default: README.md)
  --cwd <dir>        Working directory for package / README resolution (default: .)
  --allow <flag>     Ignore a flag in drift checks (repeatable; bare name ok)
  --strict-scripts   Fail when README mentions scripts missing from package.json
  --no-scripts       Skip README script cross-check (flags-only mode)
  -q, --quiet        Silent on success; print only when drift / failure
  --summary          One-line status for CI logs (silent on success unless drift)
  --exit-zero        Always exit 0 after a successful run (report still shows drift)
  --json             Print machine-readable JSON report
  -h, --help         Show this help
  -V, --version      Print version

Exit codes:
  0  Flags aligned (script mismatches are warnings unless --strict-scripts), or --exit-zero
  1  Flag drift detected, strict script mismatch, or fatal error
`);
}

/** Normalize a user-supplied allow token to a canonical flag form. */
export function normalizeAllowFlag(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^--[a-zA-Z][\w-]*$/.test(t) || /^-[a-zA-Z]$/.test(t)) return t;
  if (/^[a-zA-Z][\w-]*$/.test(t)) return `--${t}`;
  return undefined;
}

export function parseArgs(argv: string[]): ParseArgsResult {
  const options: CliOptions = {
    helpCmd: ["--help"],
    readme: "README.md",
    cwd: process.cwd(),
    allow: [],
    strictScripts: false,
    noScripts: false,
    quiet: false,
    exitZero: false,
    json: false,
    summary: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) break;

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "-V" || arg === "--version") {
      options.version = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--strict-scripts") {
      options.strictScripts = true;
      continue;
    }
    if (arg === "--no-scripts") {
      options.noScripts = true;
      continue;
    }
    if (arg === "-q" || arg === "--quiet") {
      options.quiet = true;
      continue;
    }
    if (arg === "--summary") {
      options.summary = true;
      continue;
    }
    if (arg === "--exit-zero") {
      options.exitZero = true;
      continue;
    }
    if (arg === "--help-cmd") {
      const value = argv[++i];
      if (!value || value.startsWith("-")) {
        return { options, error: `Missing value for ${arg}` };
      }
      options.helpCmd.push(value);
      continue;
    }
    if (arg.startsWith("--help-cmd=")) {
      const value = arg.slice("--help-cmd=".length);
      if (!value) return { options, error: `Missing value for --help-cmd` };
      options.helpCmd.push(value);
      continue;
    }
    if (arg === "--allow") {
      const value = argv[++i];
      if (!value) {
        return { options, error: `Missing value for ${arg}` };
      }
      const normalized = normalizeAllowFlag(value);
      if (!normalized) {
        return { options, error: `Invalid --allow value: ${value}` };
      }
      options.allow.push(normalized);
      continue;
    }
    if (arg.startsWith("--allow=")) {
      const value = arg.slice("--allow=".length);
      if (!value) return { options, error: `Missing value for --allow` };
      const normalized = normalizeAllowFlag(value);
      if (!normalized) {
        return { options, error: `Invalid --allow value: ${value}` };
      }
      options.allow.push(normalized);
      continue;
    }
    if (arg === "--bin" || arg === "--readme" || arg === "--cwd") {
      const value = argv[++i];
      if (!value || value.startsWith("-")) {
        return { options, error: `Missing value for ${arg}` };
      }
      if (arg === "--bin") options.bin = value;
      else if (arg === "--readme") options.readme = value;
      else options.cwd = value;
      continue;
    }
    if (arg.startsWith("--bin=") || arg.startsWith("--readme=") || arg.startsWith("--cwd=")) {
      const eq = arg.indexOf("=");
      const key = arg.slice(0, eq);
      const value = arg.slice(eq + 1);
      if (!value) return { options, error: `Missing value for ${key}` };
      if (key === "--bin") options.bin = value;
      else if (key === "--readme") options.readme = value;
      else options.cwd = value;
      continue;
    }

    return { options, error: `Unknown argument: ${arg}` };
  }

  return { options };
}

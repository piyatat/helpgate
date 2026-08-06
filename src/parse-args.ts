import type { CliOptions, ParseArgsResult } from "./types.js";

const VERSION = "0.1.0";

export function getVersion(): string {
  return VERSION;
}

export function printOwnHelp(): void {
  console.log(`helpgate — assert README flags match live --help

Usage:
  helpgate [--bin path] [--readme path] [--cwd dir] [--json]

Options:
  --bin <path>       Executable to run with --help (default: resolve from package.json bin)
  --readme <path>    README to scan (default: README.md)
  --cwd <dir>        Working directory for package / README resolution (default: .)
  --json             Print machine-readable JSON report
  -h, --help         Show this help
  -V, --version      Print version

Exit codes:
  0  Flags aligned (script mismatches are warnings only)
  1  Flag drift detected, or fatal error
`);
}

export function parseArgs(argv: string[]): ParseArgsResult {
  const options: CliOptions = {
    readme: "README.md",
    cwd: process.cwd(),
    json: false,
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

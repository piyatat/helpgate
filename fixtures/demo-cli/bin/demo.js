#!/usr/bin/env node
/**
 * Tiny demo CLI with intentional README drift (see ../README.md).
 * Flags: --verbose, --output <path>, --quiet, -h/--help, -V/--version
 */
const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help")) {
  console.log(`demo-cli — example target for helpgate

Usage:
  demo-cli [options]

Options:
  -v, --verbose       Verbose logging
  -o, --output <path> Write result to path
  -q, --quiet         Suppress non-error output
  -h, --help          Show help
  -V, --version       Print version
`);
  process.exit(0);
}

if (args.includes("-V") || args.includes("--version")) {
  console.log("0.0.0");
  process.exit(0);
}

console.log("demo-cli: run with --help");

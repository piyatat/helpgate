#!/usr/bin/env node
/**
 * Clean demo CLI — README matches --help.
 */
const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help")) {
  console.log(`demo-cli-clean — aligned docs example

Usage:
  demo-cli-clean [options]

Options:
  -v, --verbose  Verbose logging
  -n, --dry-run  Print actions without writing
  -h, --help     Show help
  -V, --version  Print version
`);
  process.exit(0);
}

if (args.includes("-V") || args.includes("--version")) {
  console.log("0.0.0");
  process.exit(0);
}

console.log("demo-cli-clean: run with --help");

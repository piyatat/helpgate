import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "helpgate.js");

function run(args) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

const drift = run(["--cwd", "fixtures/demo-cli"]);
if (drift.status !== 1) {
  console.error("Expected drift fixture to exit 1, got", drift.status);
  console.error(drift.stdout);
  console.error(drift.stderr);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli exits 1 (drift)");

const advisory = run(["--cwd", "fixtures/demo-cli", "--exit-zero"]);
if (advisory.status !== 0) {
  console.error("Expected --exit-zero drift fixture to exit 0, got", advisory.status);
  console.error(advisory.stdout);
  console.error(advisory.stderr);
  process.exit(1);
}
if (!advisory.stdout.includes("Drift detected") && !advisory.stdout.includes("missing")) {
  console.error("Expected --exit-zero to still print drift report");
  console.error(advisory.stdout);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli --exit-zero exits 0 (advisory)");

const clean = run(["--cwd", "fixtures/demo-cli-clean"]);
if (clean.status !== 0) {
  console.error("Expected clean fixture to exit 0, got", clean.status);
  console.error(clean.stdout);
  console.error(clean.stderr);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli-clean exits 0 (aligned)");

const allowed = run([
  "--cwd",
  "fixtures/demo-cli",
  "--allow",
  "--debug",
  "--allow",
  "--format",
  "--allow",
  "--output",
  "--allow",
  "--quiet",
  "--allow",
  "--help",
  "--allow",
  "--version",
]);
if (allowed.status !== 0) {
  console.error("Expected --allow to clear demo-cli drift, got", allowed.status);
  console.error(allowed.stdout);
  console.error(allowed.stderr);
  process.exit(1);
}
if (!allowed.stdout.includes("--debug") || !allowed.stdout.includes("Allowed")) {
  console.error("Expected human output to list allowed flags");
  console.error(allowed.stdout);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli exits 0 with --allow");

const self = run([]);
if (self.status !== 0) {
  console.error("Expected helpgate self-check to exit 0, got", self.status);
  console.error(self.stdout);
  console.error(self.stderr);
  process.exit(1);
}
console.log("✓ helpgate self-check exits 0");

const noScripts = run(["--cwd", "fixtures/demo-cli", "--no-scripts", "--json"]);
if (noScripts.status !== 1) {
  console.error("Expected --no-scripts drift fixture to exit 1 (flags), got", noScripts.status);
  process.exit(1);
}
let noScriptsReport;
try {
  noScriptsReport = JSON.parse(noScripts.stdout);
} catch {
  console.error("Expected JSON report from --no-scripts");
  process.exit(1);
}
if (noScriptsReport.scripts !== null) {
  console.error("Expected scripts=null with --no-scripts, got", noScriptsReport.scripts);
  process.exit(1);
}
if (noScriptsReport.warnings.length > 0) {
  console.error("Expected no script warnings with --no-scripts");
  process.exit(1);
}
console.log("✓ fixtures/demo-cli --no-scripts skips script checks");

console.log("All fixture checks passed.");

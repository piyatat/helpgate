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

console.log("All fixture checks passed.");

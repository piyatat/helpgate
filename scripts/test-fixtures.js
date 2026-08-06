import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "helpgate.js");

function run(cwd) {
  return spawnSync(process.execPath, [bin, "--cwd", cwd], {
    cwd: root,
    encoding: "utf8",
  });
}

const drift = run("fixtures/demo-cli");
if (drift.status !== 1) {
  console.error("Expected drift fixture to exit 1, got", drift.status);
  console.error(drift.stdout);
  console.error(drift.stderr);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli exits 1 (drift)");

const clean = run("fixtures/demo-cli-clean");
if (clean.status !== 0) {
  console.error("Expected clean fixture to exit 0, got", clean.status);
  console.error(clean.stdout);
  console.error(clean.stderr);
  process.exit(1);
}
console.log("✓ fixtures/demo-cli-clean exits 0 (aligned)");

console.log("All fixture checks passed.");

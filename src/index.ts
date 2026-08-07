import fs from "node:fs";
import path from "node:path";
import { extractFlagsFromHelp, resolvePackageBin, runHelp } from "./help.js";
import { getVersion, parseArgs, printOwnHelp } from "./parse-args.js";
import { diffFlags, extractFlagsFromReadme } from "./readme.js";
import { checkScripts } from "./scripts.js";
import type { DriftReport } from "./types.js";

export type { DriftReport, CliOptions } from "./types.js";
export { extractFlagsFromHelp } from "./help.js";
export { extractFlagsFromReadme, diffFlags } from "./readme.js";
export { checkScripts, extractScriptMentions } from "./scripts.js";

export function buildReport(opts: {
  cwd: string;
  bin: string;
  readmePath: string;
  helpText: string;
  readmeText: string;
  allow?: string[];
  strictScripts?: boolean;
  noScripts?: boolean;
}): DriftReport {
  const help = extractFlagsFromHelp(opts.helpText);
  const readme = extractFlagsFromReadme(opts.readmeText);
  const diff = diffFlags(help.flags, readme.flags);
  const allow = new Set(opts.allow ?? []);
  const allowedUsed = new Set<string>();

  const missingInHelp = diff.missingInHelp.filter((f) => {
    if (allow.has(f)) {
      allowedUsed.add(f);
      return false;
    }
    return true;
  });
  const missingInReadme = diff.missingInReadme.filter((f) => {
    if (allow.has(f)) {
      allowedUsed.add(f);
      return false;
    }
    return true;
  });

  const scripts = opts.noScripts ? null : checkScripts(opts.readmeText, opts.cwd);
  const warnings: string[] = [];

  if (scripts && scripts.missingInPackage.length > 0) {
    for (const s of scripts.missingInPackage) {
      warnings.push(`README mentions script "${s}" but it is not in package.json scripts`);
    }
  }

  const scriptFail = Boolean(opts.strictScripts && warnings.length > 0);
  const ok =
    missingInHelp.length === 0 && missingInReadme.length === 0 && !scriptFail;

  return {
    ok,
    cwd: opts.cwd,
    bin: opts.bin,
    readme: opts.readmePath,
    helpFlags: [...help.flags].sort(),
    readmeFlags: [...readme.flags].sort(),
    missingInHelp,
    missingInReadme,
    allowed: [...allowedUsed].sort(),
    scripts,
    warnings,
  };
}

function printHuman(report: DriftReport): void {
  console.log(`helpgate  bin=${report.bin}  readme=${report.readme}`);
  console.log(`  help flags   (${report.helpFlags.length}): ${report.helpFlags.join(" ") || "(none)"}`);
  console.log(
    `  readme flags (${report.readmeFlags.length}): ${report.readmeFlags.join(" ") || "(none)"}`,
  );

  if (report.missingInHelp.length > 0) {
    console.log("\n✗ In README but missing from --help:");
    for (const f of report.missingInHelp) console.log(`    ${f}`);
  }
  if (report.missingInReadme.length > 0) {
    console.log("\n✗ In --help but missing from README:");
    for (const f of report.missingInReadme) console.log(`    ${f}`);
  }

  if (report.allowed.length > 0) {
    console.log("\n○ Allowed (ignored):");
    for (const f of report.allowed) console.log(`    ${f}`);
  }

  if (report.warnings.length > 0) {
    const label = report.ok
      ? "\n⚠ Script warnings (non-fatal):"
      : "\n✗ Script mismatches:";
    console.log(label);
    for (const w of report.warnings) console.log(`    ${w}`);
  }

  if (report.ok) {
    console.log(report.warnings.length > 0 ? "\n✓ Flags aligned (with warnings)" : "\n✓ Flags aligned");
  } else if (
    report.missingInHelp.length === 0 &&
    report.missingInReadme.length === 0 &&
    report.warnings.length > 0
  ) {
    console.log("\n✗ Strict script check failed");
  } else {
    console.log("\n✗ Drift detected");
  }
}

export async function run(argv: string[]): Promise<number> {
  const { options, error } = parseArgs(argv);

  if (error) {
    console.error(`helpgate: ${error}`);
    console.error("Try `helpgate --help`.");
    return 1;
  }

  if (options.help) {
    printOwnHelp();
    return 0;
  }
  if (options.version) {
    console.log(getVersion());
    return 0;
  }

  const cwd = path.resolve(options.cwd);
  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    console.error(`helpgate: cwd is not a directory: ${cwd}`);
    return 1;
  }

  let binRel = options.bin;
  if (!binRel) {
    const resolved = resolvePackageBin(cwd);
    if (resolved.error || !resolved.bin) {
      console.error(`helpgate: ${resolved.error ?? "could not resolve bin"}`);
      return 1;
    }
    binRel = resolved.bin;
  }

  const readmePath = path.isAbsolute(options.readme)
    ? options.readme
    : path.resolve(cwd, options.readme);

  if (!fs.existsSync(readmePath)) {
    console.error(`helpgate: README not found: ${readmePath}`);
    return 1;
  }

  const helpResult = runHelp(binRel, cwd);
  if (helpResult.error) {
    console.error(`helpgate: ${helpResult.error}`);
    return 1;
  }

  const readmeText = fs.readFileSync(readmePath, "utf8");
  const report = buildReport({
    cwd,
    bin: binRel,
    readmePath,
    helpText: helpResult.text,
    readmeText,
    allow: options.allow,
    strictScripts: options.strictScripts,
    noScripts: options.noScripts,
  });

  if (options.json) {
    // JSON always emits (CI parsers); --quiet only suppresses human success chatter.
    console.log(JSON.stringify(report, null, 2));
  } else if (!options.quiet || !report.ok) {
    printHuman(report);
  }

  if (options.exitZero) return 0;
  return report.ok ? 0 : 1;
}

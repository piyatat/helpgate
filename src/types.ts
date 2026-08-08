/** Shared types for helpgate. */

export interface CliOptions {
  bin?: string;
  /** Extra args appended when invoking bin for help (default: `--help`). */
  helpCmd: string[];
  readme: string;
  cwd: string;
  /** Flags excluded from drift (repeatable `--allow`). */
  allow: string[];
  /** Optional file with one flag per line (merged into allow). */
  allowFile?: string;
  /** When true, package-script mismatches fail the gate (not warnings). */
  strictScripts: boolean;
  /** Silent on success; only print when drift / failure. */
  quiet: boolean;
  /** Always exit 0 after reporting (advisory / gradual CI adoption). */
  exitZero: boolean;
  /** Skip README script cross-check; flags-only mode. */
  noScripts: boolean;
  /** Auto-ignore --help, --version, -h, -V in drift checks. */
  ignoreMeta: boolean;
  json: boolean;
  /** One-line status for CI logs (implies --quiet on success). */
  summary: boolean;
  help: boolean;
  version: boolean;
}

export interface FlagSet {
  /** Canonical long or short form, e.g. `--verbose` or `-v` when no long form. */
  flags: Set<string>;
  /** Raw tokens found (for debugging / JSON). */
  raw: string[];
}

export interface ScriptCheck {
  mentioned: string[];
  actual: string[];
  missingInPackage: string[];
  extraInReadme: string[];
}

export interface DriftReport {
  ok: boolean;
  cwd: string;
  bin: string;
  readme: string;
  helpFlags: string[];
  readmeFlags: string[];
  /** In README but not in --help. */
  missingInHelp: string[];
  /** In --help but not mentioned in README. */
  missingInReadme: string[];
  /** Flags that were allowed and therefore omitted from missing* lists. */
  allowed: string[];
  scripts: ScriptCheck | null;
  warnings: string[];
}

export interface ParseArgsResult {
  options: CliOptions;
  error?: string;
}

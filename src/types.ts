/** Shared types for helpgate. */

export interface CliOptions {
  bin?: string;
  readme: string;
  cwd: string;
  /** Flags excluded from drift (repeatable `--allow`). */
  allow: string[];
  /** When true, package-script mismatches fail the gate (not warnings). */
  strictScripts: boolean;
  /** Silent on success; only print when drift / failure. */
  quiet: boolean;
  /** Always exit 0 after reporting (advisory / gradual CI adoption). */
  exitZero: boolean;
  json: boolean;
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

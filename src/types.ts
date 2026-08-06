/** Shared types for helpgate. */

export interface CliOptions {
  bin?: string;
  readme: string;
  cwd: string;
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
  scripts: ScriptCheck | null;
  warnings: string[];
}

export interface ParseArgsResult {
  options: CliOptions;
  error?: string;
}

import type { FlagSet } from "./types.js";

/**
 * Long flags mentioned in README / docs prose and fenced code.
 * Short flags are intentionally ignored here — CLIs almost always document
 * a long form, and bare `-D` / similar tokens create noise in install snippets.
 */
const README_LONG = /(?<![\w-])(--[a-zA-Z][\w-]*)/g;

/** Tokens that look like flags but are usually prose noise. */
const IGNORE = new Set([
  "--", // markdown / diff
]);

export function extractFlagsFromReadme(markdown: string): FlagSet {
  const flags = new Set<string>();
  const raw: string[] = [];

  // Strip HTML comments so examples inside them don't count.
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "");

  for (const m of text.matchAll(README_LONG)) {
    const f = m[1];
    if (!f || IGNORE.has(f)) continue;
    flags.add(f);
    raw.push(f);
  }

  return { flags, raw: [...new Set(raw)].sort() };
}

/**
 * Compare help vs README flag sets. Alias pairs (e.g. -h ↔ --help) count as covered
 * when only one side uses a given form.
 */
export function diffFlags(
  helpFlags: Set<string>,
  readmeFlags: Set<string>,
): { missingInHelp: string[]; missingInReadme: string[] } {
  const missingInHelp = [...readmeFlags]
    .filter((f) => !helpFlags.has(f) && !coveredByAlias(f, helpFlags))
    .sort();
  const missingInReadme = [...helpFlags]
    .filter((f) => !readmeFlags.has(f) && !coveredByAlias(f, readmeFlags))
    .sort();
  return { missingInHelp, missingInReadme };
}

/** -h ↔ --help, -V ↔ --version style aliases when only one side uses the long form. */
const ALIASES: Record<string, string[]> = {
  "-h": ["--help"],
  "--help": ["-h"],
  "-V": ["--version"],
  "--version": ["-V", "-v"],
  "-v": ["--version", "--verbose"],
  "--verbose": ["-v"],
};

function coveredByAlias(flag: string, other: Set<string>): boolean {
  const alts = ALIASES[flag];
  if (!alts) return false;
  return alts.some((a) => other.has(a));
}

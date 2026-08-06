import fs from "node:fs";
import path from "node:path";
import type { ScriptCheck } from "./types.js";

/** npm/pnpm/yarn/bun run script references in README. */
const SCRIPT_PATTERNS = [
  /\b(?:npm|pnpm|yarn|bun)\s+run\s+([a-zA-Z0-9:_-]+)/g,
  /\b(?:npm|pnpm|yarn|bun)\s+(test|start|build|lint|prepare|prepublish(?:Only)?|postinstall)\b/g,
];

export function extractScriptMentions(markdown: string): string[] {
  const found = new Set<string>();
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "");

  for (const re of SCRIPT_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const name = m[1];
      if (name) found.add(name);
    }
  }

  return [...found].sort();
}

export function loadPackageScripts(cwd: string): { scripts: string[]; error?: string } {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { scripts: [], error: `No package.json in ${cwd}` };
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    return { scripts: Object.keys(pkg.scripts ?? {}).sort() };
  } catch (e) {
    return {
      scripts: [],
      error: `Invalid package.json: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * Soft check: scripts named in README should exist in package.json.
 * Extra scripts in package.json are not warned (common to have unpublished scripts).
 */
export function checkScripts(readmeMarkdown: string, cwd: string): ScriptCheck | null {
  const { scripts: actual, error } = loadPackageScripts(cwd);
  if (error && !fs.existsSync(path.join(cwd, "package.json"))) {
    return null;
  }

  const mentioned = extractScriptMentions(readmeMarkdown);
  const actualSet = new Set(actual);

  // Built-in lifecycle / shorthand that may not appear in scripts.
  const builtins = new Set(["start", "test"]);

  const missingInPackage = mentioned.filter(
    (s) => !actualSet.has(s) && !builtins.has(s),
  );

  return {
    mentioned,
    actual,
    missingInPackage,
    // Reserved for symmetry; unused — extras in README that aren't scripts.
    extraInReadme: [],
  };
}

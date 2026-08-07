# helpgate

Assert that README / docs flags match live `--help` (and optionally package scripts) before you ship.

When docs invent flags the binary never grew — or the CLI gains options nobody documented — helpgate exits non-zero so CI can block the release.

## Install

```bash
npm install helpgate
# typically as a devDependency; or from a clone:
npm install && npm run build
```

Requires **Node.js >= 18**. Zero runtime dependencies.

## Usage

```bash
helpgate [--bin path] [--readme path] [--cwd dir] [--allow flag] [--json]
```

| Flag | Description |
| --- | --- |
| `--bin <path>` | Executable to invoke with `--help` (default: `package.json` `bin`) |
| `--readme <path>` | Markdown to scan (default: `README.md`) |
| `--cwd <dir>` | Resolve package / README relative to this directory (default: `.`) |
| `--allow <flag>` | Ignore a flag in drift checks (repeatable; bare names are accepted) |
| `--json` | Print a machine-readable report |
| `--help` | Show help |
| `--version` | Print version |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Flags aligned (script mismatches are warnings only) |
| `1` | Flag drift, or a fatal error (missing bin / README / help output) |

### What it checks

1. Runs `<bin>` with help, extracts long and short option names.
2. Scans the README for the same flag tokens.
3. Reports **missing in help** (docs-only) and **missing in README** (undocumented CLI flags).
4. Soft-warns when README mentions `npm run <script>` (etc.) that is not in `package.json` `scripts`.
5. Honors repeatable `--allow` so intentional internal or transitional flags do not fail CI.

Short/long aliases (for example help / version) are treated as matching.

## Examples

Against the bundled fixtures:

```bash
# Intentional drift → exit 1
npx helpgate --cwd fixtures/demo-cli

# Clean alignment → exit 0
npx helpgate --cwd fixtures/demo-cli-clean

# JSON for CI
npx helpgate --cwd fixtures/demo-cli --json

# Allow known drift (docs-only / undocumented) → exit 0
npx helpgate --cwd fixtures/demo-cli \
  --allow debug --allow format \
  --allow output --allow quiet \
  --allow help --allow version
```

Wire into release:

```json
{
  "scripts": {
    "prepublishOnly": "helpgate"
  }
}
```

## Development

```bash
npm install
npm run build
node bin/helpgate.js --help
npm run test:fixtures
```

## License

MIT

# demo-cli

Intentionally **drifts** from the real CLI so helpgate can demo failures.

## Usage

```bash
demo-cli --verbose
demo-cli --debug
demo-cli --format json
```

Documented flags:

- `--verbose` — verbose logging (real)
- `--debug` — debug mode (docs-only; not in the binary)
- `--format` — output format (docs-only; not in the binary)

The live binary also exposes output path, quiet mode, and version options that this README never names.

## Scripts

```bash
npm run start
npm run build
npm run deploy
```

`deploy` is mentioned here but not defined in `package.json` (soft warning).

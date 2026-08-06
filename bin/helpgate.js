#!/usr/bin/env node
import { run } from "../dist/index.js";

const code = await run(process.argv.slice(2));
process.exit(code);

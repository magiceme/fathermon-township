import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let cli;
try { cli = require.resolve('playwright/package.json').replace('package.json', 'cli.js'); }
catch { cli = '/opt/codex/cua_node/lib/node_modules/playwright/cli.js'; }
const result = spawnSync(process.execPath, [cli, 'test', ...process.argv.slice(2)], {stdio:'inherit', env: {...process.env, NODE_PATH: process.env.NODE_PATH || '/opt/codex/cua_node/lib/node_modules'}});
process.exit(result.status ?? 1);

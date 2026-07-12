import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(root, 'apps/server/src/server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(root, 'apps/desktop/dist-electron/server.bundle.cjs'),
  target: 'node18',
  sourcemap: false,
  packages: 'bundle',
  // Electron loads this as CJS — never leave a bare import.meta.url that becomes undefined
  banner: {
    js: 'var import_meta_url = require("url").pathToFileURL(__filename).href;',
  },
  define: {
    'import.meta.url': 'import_meta_url',
  },
  logLevel: 'info',
});

console.log('Bundled server → apps/desktop/dist-electron/server.bundle.cjs');

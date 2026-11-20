// Leonida Legend — entry program for the gta6-trophy-guide-01 bounty.
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with make.fun's frontend dossier
// library. It never deletes the output directory itself: it only refreshes
// the three entries it owns (app/, screenshots/, dossier.json), so a run
// always ends with the same bytes.
//
// Run it like the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Without MAKEFUN_OUTPUT_DIR it writes to /output.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const appSource = join(repoRoot, 'app');
const shotsSource = join(repoRoot, 'screenshots');

if (!existsSync(appSource)) {
  throw new Error(`main.ts: no app/ directory in ${repoRoot}`);
}
if (!existsSync(shotsSource)) {
  throw new Error(`main.ts: no screenshots/ directory in ${repoRoot}`);
}

// Create the output directory when it is missing, but never remove it.
mkdirSync(outputDir, { recursive: true });

// Refresh only the entries this program owns, so a second run writes the
// same bytes as the first and leaves anything else in the directory alone.
for (const name of ['app', 'screenshots', 'dossier.json']) {
  const target = join(outputDir, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

cpSync(appSource, join(outputDir, 'app'), { recursive: true });
cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Leonida Legend: wrote ${outputDir}/dossier.json (${dossier.length} bytes)`);

// A short summary, so a run's output shows what was handed in.
const shotFiles = readdirSync(join(outputDir, 'screenshots')).filter((f) => !f.startsWith('.'));
console.log(`app/: ${countFiles(join(outputDir, 'app'))} files, screenshots/: ${shotFiles.length} files`);

// Counts every regular file under a directory, recursively.
function countFiles(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

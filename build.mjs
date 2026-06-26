import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIST = 'dist';

mkdirSync(DIST, { recursive: true });

execSync(`npx esbuild app.js --bundle --minify --format=esm --outfile=${DIST}/bundle.js`, { stdio: 'inherit' });
execSync(`npx esbuild styles.css --minify --outfile=${DIST}/style.min.css`, { stdio: 'inherit' });
execSync(`npx esbuild legal.js --minify --outfile=${DIST}/legal.min.js`, { stdio: 'inherit' });

const css = readFileSync(`${DIST}/style.min.css`, 'utf-8');
const js  = readFileSync(`${DIST}/bundle.js`, 'utf-8');
const ljs = readFileSync(`${DIST}/legal.min.js`, 'utf-8');

let html = readFileSync('index.html', 'utf-8');
html = html.replace(
  '<link rel="stylesheet" href="./styles.css">',
  `<style>${css}</style>`
);
html = html.replace(
  '<script type="module" src="./app.js" defer></script>',
  `<script type="module">${js}</script>`
);
writeFileSync(`${DIST}/index.html`, html);
console.log(`✓ ${DIST}/index.html  (${(html.length / 1024).toFixed()} KB)`);

for (const page of ['impressum.html', 'datenschutz.html']) {
  let content = readFileSync(page, 'utf-8');
  content = content.replace(
    '<link rel="stylesheet" href="styles.css" />',
    `<style>${css}</style>`
  );
  content = content.replace(
    '<script src="legal.js"></script>',
    `<script>${ljs}</script>`
  );
  writeFileSync(`${DIST}/${page}`, content);
  console.log(`✓ ${DIST}/${page}  (${(content.length / 1024).toFixed()} KB)`);
}

import { Script } from 'node:vm';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(resolve(root, p), 'utf8');
const styles = (await Promise.all(['base.css', 'polish.css'].map(p => read('src/' + p)))).join('\n');
const scripts = (await Promise.all(['original-art.js', 'game.js', 'systems.js', 'characters3d.js', 'animation.js', 'graphics.js', 'world.js', 'interface.js', 'character-preview.js', 'community.js', 'homes.js', 'townlife.js', 'biomes.js', 'interiors.js', 'traversal.js', 'dialogue-a.js', 'dialogue-b.js', 'dialogue-c.js', 'conversations.js', 'bridges.js', 'collections.js', 'services.js', 'guests.js', 'daily.js', 'audio.js', 'controls.js', 'home-life.js', 'seasons.js', 'weather.js', 'accessibility.js'].map(p => read('src/' + p)))).join('\n;\n');
new Script(scripts); // Fail the build on cross-module syntax or declaration errors.
const html = (await read('src/template.html'))
  .replace('<!-- STYLES -->', () => `<style>${styles}</style>`)
  .replace('<!-- SCRIPTS -->', () => `<script>${scripts}\nresize();showIntro();requestAnimationFrame(loop);\n</script>`);
await mkdir(resolve(root, 'dist'), {recursive:true});
await writeFile(resolve(root, 'dist/index.html'), html);
await writeFile(resolve(root, 'index.html'), html);
await writeFile(resolve(root, 'dist/Fathermon_Township_v0.6.html'), html);
console.log(`Built standalone v0.6 (${(Buffer.byteLength(html)/1024).toFixed(0)} KiB); original art embedded.`);

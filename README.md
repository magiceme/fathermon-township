# Fathermon Township v0.6 Beta

An incremental expansion of the supplied **v0.5: Build Your Dream Town** by SayverOcean Game Studio. All ten original drawings remain embedded and unchanged. The original town coordinates, residents, recipes, and three chapters remain intact inside a larger world.

## Play

Open `dist/Fathermon_Township_v0.6.html` in a modern browser. It is a self-contained, offline playable file. For reliable browser save storage and updates, serve `dist/` over HTTP or deploy the Netlify ZIP. Saves belong to the browser and origin; export JSON before switching between a downloaded file and a website.

New Game → choose one of three save slots → choose a Fathermon and name your township. You arrive alone. Read the welcome board, gather materials, build cottages, and invite neighbors. Restore the workshop in Chapter 2 to make furniture and field tools. Home furniture has a Use mode for sleeping, cooking, eating, reading and daily care; choose Place to decorate. Town groups daily tasks, seasons/weather, the collection journal, crafting, services, guests and exploration. Grow the town rating, build a guesthouse and services, complete missions, learn travel skills, explore biomes and construct bridges. The collection journal explains rare habitats. The calendar holds birthday settings and real-date events.

## Develop and test

Requires Node.js 24, npm, Python 3, and Chromium for browser tests. This cloud machine provides those tools.

```sh
npm ci --ignore-scripts
npm run build
npm run dev
```

In another shell, run `npm test`. It builds the single HTML and runs the existing browser tests against the local server. `CHROMIUM_PATH` selects a different Chromium executable; the cloud default is `/usr/bin/chromium`. `node tools/export-models.mjs` regenerates the ten reusable GLB meshes. `python3 tools/package.py` packages the playable, deployment, source, and model archives after building and testing.

Use the existing checkout in each isolated task. A Git worktree is unnecessary.

## Source layout

| File | Responsibility |
| --- | --- |
| `src/game.js` | Preserved v0.5 gameplay, recipes, chapters, and fallback engine |
| `src/original-art.js` | Ten untouched embedded drawings |
| `src/systems.js` | Navigation, collision, safe edit transactions, social routines |
| `src/characters3d.js`, `src/animation.js` | Rounded character meshes, detail levels, procedural animation |
| `src/graphics.js`, `src/world.js` | Cached WebGL scenery, lighting, weather, expanded world, fallback |
| `src/interface.js`, `src/character-preview.js` | Opening, three slots, validation/migration, settings, real mesh previews |
| `src/community.js`, `src/homes.js`, `src/townlife.js` | Furniture workshop, home modules, projects, hotel, stars, learned tools |
| `src/biomes.js`, `src/traversal.js`, `src/seasons.js`, `src/weather.js` | Climates, crops, learned travel, town seasons and forecasts |
| `src/collections.js`, `src/services.js`, `src/guests.js`, `src/daily.js` | Tools and specimens, service missions, 30 guests, daily/calendar progress |
| `src/conversations.js`, dialogue data, `src/home-life.js` | Contextual conversation and interactive furniture |
| `src/audio.js`, `src/controls.js` | Original music, sound, touch/controller/Chromebook input |
| `src/accessibility.js`, CSS, HTML template | Map, HUD layout, accessible controls and visual presentation |
| `tests/` | Browser validation of the original and expanded workflows |

The build has no runtime library, CDN, account, API key, or service dependency. Playwright is a development-only dependency. Environment setup and server restart instructions are also saved in the cloud configuration draft.

See [the changelog](docs/CHANGELOG.md), [bug-fix report](docs/BUG_FIX_REPORT.md), [validation and limitations](docs/VALIDATION.md), and [screenshots](docs/SCREENSHOTS.md).

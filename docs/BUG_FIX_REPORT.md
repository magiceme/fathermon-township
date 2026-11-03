# Bug-fix report

| Issue | Implemented correction | Evidence |
| --- | --- | --- |
| Weak save shape/version handling could accept invalid fields or lose later-format data | Schema6 normalizes supported versions, counters, assets, furniture, coordinates and slots; original keys remain | v0.3/v0.4/v0.5 migration and JSON roundtrip tests |
| Two integrated modules declared the same top-level identifier, preventing all scripts from loading | Distinct adapter names; build validates the complete assembled script before producing artifacts | Combined build syntax validation and browser startup checks |
| Direct workshop repair and Designer market placement could bypass prerequisites | Repair requires chapter eligibility, workshop discovery and resources; every market placement path checks restoration | Progression gate browser test |
| Workshop site exclusion used `{x,z}` with a function expecting `{x,y}`, producing NaN | Shared finite-coordinate checks and actual footprints reserve landmarks and plots | Placement and chapter tests |
| Walking targets stalled against houses; NPC movement ignored solids | Collision-aware movement, bounded A*, route smoothing, no diagonal corner cuts, safe arrival/actor recovery | Cottage routing and expanded bridge tests |
| Cottages, pond, camp, workshop and resources had inconsistent collision | Shared physical footprints; wing/hotel/handmade furniture extensions use the same validation | Collision, modular home and hotel tests |
| Whole-state undo could erase later gathered resources, remove occupied homes or duplicate costs | Edit transactions reverse only changed object fields and material deltas; invitations and permanent lessons clear unsafe history; occupied homes/active guesthouse are protected | Gather-after-build undo/redo and home tests |
| Undo also risked removing milestone coin rewards | Edit coin deltas are isolated from chapter rewards | Transaction review and progression regression suite |
| Renderer rebuilt all scenery arrays and uploaded them every painted frame | Retained static scenery buffers with fingerprint/chunk invalidation; cached character meshes and attribute/uniform locations | Idle scene geometry-build count remains unchanged; GPU error checks |
| WebGL minimap was stale, camera controls overlapped, and fallback gesture handlers competed | Live minimap, separate HUD lanes, one fallback gesture route, selectable renderer and context-loss recovery | Viewport, map and WebGL absence/loss browser tests; screenshot review |
| Leaving a modal could retain movement input or leave completed chapter requirements waiting | Input reset, focus return/trap, deferred chapter readiness checks | UI focus and full Chapters 1–3 tests |
| Room additions could overlap landmarks or strand furniture after removal | Physical module fit checks, usable extra tiles, occupied-wing removal guard, coordinate persistence | Wing collision/material/save tests |

This work retains the existing game and original art rather than replacing its systems. No failed requirement was disabled to obtain passing tests.

Additional integration fixes include retaining service building IDs and upgrade levels in saves; retaining all 40 wing-room furniture spaces; keeping furniture rotation, finishes and lamp state; making touch buttons call the latest interaction handlers; separating native form keyboard input from game movement; preventing NPCs from inheriting the player's flight collision rules; suppressing labels that covered the diving player; and keeping current activity dialogs above the home editor.

The collection ledger reconciles fish and insect quantities after cooking, trading, gifts and donations. Daily, achievement, service, guest and event claims have duplicate guards. Automated tests exercise the actual claim and consumption paths.

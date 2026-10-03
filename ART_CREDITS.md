# Art provenance

This project is private (`UNLICENSED`). Runtime art is bundled for this game only.

## Main-menu key art (2026-08-13)

- Files: `public/play/assets/art-v4/menu-keyart-wide.webp`, `public/play/assets/art-v4/menu-keyart-portrait.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: original text-free layered paper-cut cover art for *Starsprout Rift Run*
- Project references: `art-v2/hero-sprites.webp`, `art-v2/environments-a.webp`, `art-v3/environments-c.webp`
- Responsive outputs: a 16:9 wide composition and a separately recomposed 9:16 portrait composition; neither is a hard crop of the other
- Runtime processing: WebP at 1600×900 (quality 84) and 900×1600 (quality 82)

Prompt summary: keep the existing navy sprout explorer identity; show one hero approaching a torn-paper portal containing windmill, crystal and aurora worlds; reserve calm dark space for HTML branding and controls; no text, UI, logo, watermark, border, copied character or Mario imagery.

The title, progress, navigation and call-to-action are live HTML/CSS, not baked into the generated art.

## Act IV environments and star-whale Boss (2026-09-17)

- Files: `public/play/assets/art-v5/environments-d.webp`, `public/play/assets/art-v5/boss-star-whale.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: original text-free layered paper-cut environments and a brass-and-navy celestial whale built for *Starsprout Rift Run*
- Project references: the existing `art-v2` and `art-v3` environment and Boss atlases
- Environment cells: zero-gravity orbital garden, timesand cloister, delayed-echo twin city, and star-whale court
- Boss cells: idle, charge, dive, shield, beam, stunned, open core, and defeated states in a 4×2 atlas
- Runtime processing: environment atlas resized to 2048×1152 WebP (quality 84); Boss atlas stored as a 1536×1024 lossless WebP with alpha

Prompt summary: extend the existing navy, teal, warm-paper and brass visual language; make each of four environments immediately distinguishable by silhouette and traversal landmark; design an original celestial whale with a readable chest star-core and moving orbital-anchor motifs; no text, UI, logo, watermark, copied character or franchise imagery.

## Act V environments and thousand-page warden (2026-09-22)

- Files: `public/play/assets/art-v6/environments-e.webp`, `public/play/assets/art-v6/boss-fold-warden.png`
- Tool: OpenAI built-in ImageGen
- Creative direction: original text-free layered paper-cut environments and an origami phoenix-crane guardian built for *Starsprout Rift Run*
- Project references: `art-v5/environments-d.webp` and `art-v5/boss-star-whale.webp`
- Environment cells: foldpaper canyon, kitewind spire, turning-page ink escape, and thousand-page aviary
- Boss cells: idle, dive telegraph, dive, shield, trapped, stunned, open core, and defeated states in a 4×2 atlas
- Runtime processing: environment atlas resized to 2048×1152 WebP (quality 84); Boss atlas resized to 1536×1024 palette PNG for mobile loading

Prompt summary: preserve the navy, teal, coral, warm-paper and brass language while giving each level a different traversal silhouette; show readable fold creases, kite tethers, a reverse-travel ink wave and a foldable arena; design an original book-page bird guardian with a bright chest core; no text, UI, logo, watermark or franchise imagery.

## Starsprout Night Watch arena (2026-09-22)

- File: `public/play/assets/art-v7/trials-nightwatch.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: original text-free midnight observatory arena for the independent *Starsprout Night Watch* defense mode
- Project reference: `public/play/assets/art-v4/menu-keyart-wide.webp` for paper-cut material language only
- Runtime processing: centered 16:9 crop at 1920×1080, WebP quality 84

Prompt summary: create a symmetrical midnight paper observatory with a luminous turquoise world-seed reactor at center and violet rift gates at both edges; reserve a clear lower gameplay lane; use indigo, electric cyan, violet, warm paper and restrained coral; environment only, with no characters, UI, text, logos or watermark.

## Late-game creature atlas (2026-09-23)

- File: `public/play/assets/art-v8/enemy-atlas-c.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: six original paper-cut creatures with instantly different combat silhouettes for *Starsprout Rift Run*
- Project reference: `public/play/assets/art-v2/enemy-atlas-b.webp` for material, outline weight and atlas presentation only
- Cells: thunder drummer, thread spinner, chrono leech, mirror mimic, fold beetle, and star siphon in a 3×2 atlas
- Runtime processing: generated at 1536×1024, background extracted to alpha, then converted to transparent WebP (quality 88, alpha quality 100) for the mobile package

Final prompt summary: create a clean 3×2 sprite atlas of six original enemies in the established layered paper-cut style, each centered in its own cell with a distinctive silhouette and no text, UI, logo or watermark; then remove the dark presentation background while preserving soft paper edges, internal shading and full transparency outside the creatures.

## Diegetic mechanism atlas (2026-09-23)

- File: `public/play/assets/art-v9/mechanism-atlas.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: eight text-free paper-cut mechanisms that belong to the campaign environments rather than reading as UI badges
- Project references: `art-v2/environments-b.webp`, `art-v3/environments-c.webp`, and `art-v2/collectibles.webp`
- Cells: tidal repair shrine, aurora reactor, sun relay, moon relay, echo mirror pad, constellation anchor, fold trap, and polarity dial in a 4×2 atlas
- Runtime processing: generated at 1536×1024 with alpha and converted to transparent WebP (quality 88, alpha quality 100)

Prompt summary: match the existing navy-ink, warm-paper, teal-glass and aged-brass language; give every mechanism a distinct side-view silhouette and readable physical state; preserve transparent separation between cells; no text, Chinese characters, numbers, labels, UI, scenery, characters, logos or watermark.

## Act VI environments and sky paper dragon (2026-09-28)

- Files: `public/play/assets/art-v10/environments-f.webp`, `public/play/assets/art-v10/boss-sky-paper-dragon.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: original text-free layered paper-cut environments and a living celestial paper dragon built for *Starsprout Rift Run*
- Project references: `art-v6/environments-e.webp`, `art-v5/boss-star-whale.webp`, and `art-v6/boss-fold-warden.png` for the established material, palette and atlas language only
- Environment cells: starweight balance court, foreground/background silhouette harbor, trajectory-stitch meadow, and sky paper dragon arena in a 2×2 atlas
- Boss cells: idle, body-as-bridge, charge, dive, shield, stunned, open core, and defeated states in a 4×2 atlas
- Runtime processing: environment atlas resized to 2048×1152 opaque WebP (quality 82, effort 6); Boss atlas resized to 1536×768 transparent WebP (quality 86, alpha quality 100, effort 6)

Prompt summary: extend the navy, teal, coral, warm-paper and aged-brass language into four readable Act VI traversal spaces; foreground giant balance scales, a two-depth harbor, luminous embroidered movement trails and a dragon-body platform arena; design an original long paper dragon whose three knot-scales and crown core remain legible across eight combat states; keep atlas cells cleanly separated with no text, UI, logo, watermark or franchise imagery.

## Act VII environments, creatures, mechanisms and scorewing maestro (2026-09-29)

- Files: `public/play/assets/art-v11/environments-g.webp`, `public/play/assets/art-v11/enemy-atlas-d.webp`, `public/play/assets/art-v11/mechanism-atlas-b.webp`, `public/play/assets/art-v11/boss-scorewing-maestro.webp`
- Tool: OpenAI built-in ImageGen
- Creative direction: an original text-free final act whose scale-changing garden, branching comet railway, lantern-shadow city and score-paper finale each communicate a different play rule while retaining the established handcrafted paper world
- Environment cells: Dewdrop Miniature Garden, Cometline Switchyard, Hidden-Lantern Silhouette City and Grand Cadence Theater in a 2×2 atlas
- Creature cells: lens beetle, rail wisp and lantern heron, plus their small, charging and alert variants in a 3×2 atlas
- Mechanism cells: dew lens, fiber iris, rail junction, rail station, lantern screen, shadow-key altar, crown shard and crown receptor in a 4×2 atlas
- Boss cells: idle, charge, shard cast, volley guard, stunned, open core, enraged and defeated states in a 4×2 atlas
- Runtime processing: environment atlas resized to 2048×1152 opaque WebP; creature and mechanism atlases resized to 1536×1024 transparent WebP; Boss atlas resized to 1536×768 transparent WebP. The complete packaged art set remains below the project's 16 MiB mobile budget.
- Generated sources: `C:/Users/wjm19/.codex/generated_images/01a0ae1c-737f-7d33-bbbe-109a3181e673/exec-5711f713-40c5-4a02-9f5b-fcb7dbf17091.png`, `exec-6e4d848d-f0e8-432a-a50c-a5f9d3bbdb99.png`, `exec-bf8f6834-270b-4263-9092-bd3ef117e780.png`, and `exec-6a4414e6-9fe2-46cc-a4c8-99666bbf9199.png`

Environment prompt summary: create a 2×2 handcrafted paper-cut environment atlas showing a giant dew-lens and fiber garden, a foil comet railway with active junctions, an amber lantern city with movable screens, and a crown-finale theater with score-paper curtains and orbiting shards; use navy, teal, coral, warm paper and brass; no text, UI, characters, logos or watermark.

Creature prompt summary: create a transparent 3×2 atlas containing a lens beetle, rail wisp and lantern heron on the top row, then their small, charging and alert variants below; keep the established storybook paper-cut construction, clean cell separation and no environment, text or UI.

Mechanism prompt summary: create a transparent 4×2 atlas containing a dew lens, fiber iris, rail junction, rail station, lantern screen, shadow-key altar, crown shard and crown receptor; make each object tactile and physically readable in paper and foil, with no characters, labels, placeholder glyphs or UI.

Boss prompt summary: create a transparent 4×2 sprite atlas for an original celestial paper moth conductor with ivory score-paper wings, navy edging, teal windows and coral-brass ornaments; show idle, charge, shard cast, guard, stunned, core-open, enraged and defeated states; no text, scenery, UI, logo or watermark.

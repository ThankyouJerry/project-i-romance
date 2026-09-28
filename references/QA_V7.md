# Sprite boundary regression — 2026-09-29

The previous first-scene QA missed adjacent-frame hair visible in Rose episode 2. Equal-width CSS crops were incorrect for generated atlases with hair extending across nominal thirds.

The renderer now uses per-atlas SVG clipping boundaries derived from alpha valleys between figures. Original raster assets are unchanged; boundaries can extend beyond the nominal third to retain the intended figure. The build helper requires Pillow, NumPy and SciPy, but deployed runtime and CI consume the checked-in sprite-clips.js and need no Python dependency.

- Inspected all 99 cuts (11 characters, 3 families, 3 poses) on alternating light/dark backgrounds after image decoding completed.
- Reproduced and visually checked Rose episode 2 without dialogue covering the figure; both side fragments removed.
- Added regression checks excluding known neighbor-hair coordinates while retaining Rose body points, and coverage checks for all 99 cuts.
- Existing story and visual-state tests pass.
- Review-only pages are not included in deployment.

This audit covers sprite boundary contamination; it is not a claim of exhaustive manual story-path or mobile-device QA.

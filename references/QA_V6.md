# V6 verification — 2026-09-28

- Editorial: final loaded data reviewed by a separate editing agent; 88 chapters, 22 outings, 33 romance ending pages, character endings and reactions. See DIALOGUE_REVIEW_V6.md for 29 corrections.
- Automated: story.test.cjs and visual-state.test.cjs passed in both authoring and publishing directories. Includes save migration, choices, endings, schedules, assets and outfit continuity.
- Visual: 11 first scenes captured individually using the local review surface; reviewed character/background composition. Popo maid uniform and final-date dress checked, transparent assets composited over actual backgrounds. New source sprites have RGBA transparency and were converted to WebP without discarding alpha.
- Browser: new game → Popo episode 1 → choice → reaction → reload → continue restored the reaction and outfit. Title ownership notice confirmed. Picture-view toggle checked.
- Limitation: requested mobile viewport did not take effect in browser tool; mobile layout is not claimed as verified. Full manual playthrough of every branching path was not performed; exhaustive path checks above are automated.
- Local review controls and generated-image master files are excluded from the public build.

Changes include Popo maid-cafe arc, confidence/mistake/recovery and late feminine outfit; Ori jazz and suit-to-date progression; Siho skirt outfits; softer Popo face; revised Siyo/Siho proportions; Ori eye tone, yellow hair and employee badge; title nonprofit/design ownership notice.

---
plan: 04-02
phase: 04-per-project-polish-redesigns
status: complete
started: "2026-03-12"
completed: "2026-03-12"
duration: ~5 min
tasks_completed: 3
tasks_total: 3
---

# Plan 04-02: Songdle SoundCloud Widget API Audio Fix

## Result

All tasks completed. Songdle audio playback migrated from direct Audio/preview URLs to SoundCloud Widget API with iframe embeds. YouTube fallback chain preserved. Enrichment script created for seeding SoundCloud URLs. 6 integration tests covering playback priority and fallback scenarios.

## Tasks

| # | Task | Status | Commit |
|---|------|--------|--------|
| 0 | Write integration tests for SoundCloud widget playback | Done | a0af7a0 |
| 1 | Integrate SoundCloud Widget API into Songdle | Done | 25c296b |
| 2 | Create enrichment script and seed songs.json | Done | 4207426 |

## Key Files

### Created
- `__tests__/songdle-soundcloud.test.js` — 6 test cases for SC widget, YouTube fallback, seekTo(0)
- `projects/songdle/enrich-soundcloud.js` — Build script probing SoundCloud oEmbed endpoint

### Modified
- `projects/songdle/index.html` — Hidden SC iframe, Widget API script loaded
- `projects/songdle/script.js` — SC Widget init, playClip() priority chain (SC -> YouTube -> proxy), seekTo(0) before play
- `projects/songdle/songs.json` — 10 songs seeded with verified SoundCloud URLs

## Decisions

- Priority chain: SoundCloud Widget -> YouTube IFrame -> stream proxy fallback
- seekTo(0) called before every SC play to ensure playback from beginning
- Hidden iframe approach (not visible player) to match existing UI

## Deviations

None.

## Self-Check: PASSED

- [x] SoundCloud Widget API integrated with iframe
- [x] seekTo(0) ensures playback from beginning
- [x] YouTube fallback when SC unavailable
- [x] Enrichment script created
- [x] 10 songs seeded with SoundCloud URLs
- [x] 6 integration tests passing
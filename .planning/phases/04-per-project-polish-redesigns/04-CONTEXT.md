# Phase 4: Per-Project Polish + Redesigns - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver project-specific signature animations (Handoff deploy sequence, Songdle audio fix) and full visual redesigns of Study Smart (retro OS aesthetic) and Connect Four (modern polish). Each project gets at least one memorable moment unique to it. The Songdle audio visualizer (SIG-02) is descoped — the signature moment is reliable SoundCloud-based playback, not a visual effect.

</domain>

<decisions>
## Implementation Decisions

### Handoff deploy sequence (SIG-01)
- Rocket launch animation — abstract creative sequence, not a realistic CI/CD pipeline
- Stages: energy buildup → launch with trail → rocket rises → clean reveal of live URL with subtle glow
- Duration matches real deploy API call (~3-5s). If API finishes early, animation accelerates to completion
- No confetti or starburst — success moment is the rocket smoothly transitioning into the live URL
- Replaces current "Deploying your site..." text + spinner

### Songdle audio fix (SIG-02 revised)
- No audio visualizer — current Songdle visual design stays as-is, it's already polished
- Fix audio playback by switching to SoundCloud Widget API (hidden iframe + SC.Widget JS SDK)
- Iframe is completely hidden (0x0 or off-screen) — existing custom play/pause UI controls the widget via SDK
- Call `seekTo(0)` before each play to guarantee playback from second 0 of full track
- Pre-populate songs.json with SoundCloud track URLs using a build/enrichment script (not resolved at runtime)
- Do NOT use iTunes/Deezer/Spotify preview APIs — they serve mid-song clips
- Do NOT use `new Audio(soundcloudUrl)` — CORS blocks direct audio element access to SoundCloud URLs

### Study Smart retro OS redesign (REDESIGN-01, REDESIGN-02, REDESIGN-03)
- Rename StudyBuddy to "Study Smart" — update title, all references, URL stubs
- Full retro OS desktop aesthetic matching the provided screenshot reference
- **Background:** Grid/graph paper texture (light cream with subtle grid lines)
- **Palette:** Warm brown tones (#5C3D2E range) for window chrome, text, icons, borders
- **Title:** Cursive/script font for "Study Smart" header (matching screenshot style)
- **Window panels:** Retro title bars with minimize/maximize/close buttons on each panel
  - Minimize: functional — collapses panel to just the title bar
  - Close and maximize: decorative only (visual retro styling, no behavior)
- **Panels are draggable** — users can rearrange panels on the desktop. Grid positions are the default layout
- **Layout panels (matching screenshot):**
  - Timer panel (left top): large digital time display, START button, session counter (1/4), reset icon, Pomodoro/Short Break/Long Break mode tabs, settings gear icon
  - To-do list panel (left bottom): checkbox tasks with drag handles, due date display, timer icon, delete button, + add button
  - Music genre grid (right top): 10 genres in 5x2 grid with retro icons — Lo-Fi, Jazz, Piano, Classical, Acoustic, Kalimba, K-Pop, Cafe, Library, Nature
  - Volume/playback controls (right middle): speaker icon, scrub bar, play button
  - Inspirational quote widget (right bottom): large quotation marks, quote text with attribution, refresh/cycle button
- **Music genres replace ambient sounds** — the current Rain/Cafe/Nature/White Noise system is replaced with the genre-based music grid. Audio source for each genre TBD by researcher (free audio streams, YouTube embeds, etc.)
- **Quote widget is new** — hardcoded array of inspirational quotes cycled with refresh button
- **All existing features must survive:** pomodoro timer, tasks (CRUD, search, filter, priority, due dates), stats (Chart.js), settings (durations, sound, notifications), keyboard shortcuts
- Stats and Settings sections: restyle in retro window chrome but keep functionality identical

### Connect Four redesign (REDESIGN-04, SIG-03)
- **Light/clean theme:** white/near-white background (#f8fafc), light gray board (#e2e8f0), bold red (#dc2626) and gold (#ca8a04) discs, soft shadows, rounded corners
- **Disc drop animation:** physics bounce — disc falls from top, bounces once at landing with dampening. ~400ms total. Playful and satisfying
- **Winning highlight:** glowing line draws through the four winning discs (like crossing them off) + discs themselves glow. Non-winning discs dim slightly. Green highlight (#16a34a)
- **Column hover:** subtle background highlight on the hovered column (no ghost disc preview)
- **Overall feel:** Apple-esque clean design, soft grid lines (#cbd5e1), rounded board container

### Claude's Discretion
- Rocket launch animation implementation details (CSS vs canvas vs SVG)
- Study Smart panel default positions and responsive behavior on mobile
- How dragging is implemented (CSS transform, drag library, native drag API)
- Music genre audio sources and playback implementation
- Number and selection of inspirational quotes
- Connect Four board rendering approach (CSS Grid vs absolute positioning)
- How to handle Study Smart stats/settings panels (separate windows or integrated)
- SoundCloud track URL enrichment script implementation

</decisions>

<specifics>
## Specific Ideas

- Handoff rocket should feel cinematic but not over-the-top — clean reveal, not confetti
- Study Smart redesign based on a specific screenshot reference (provided during discussion) — cursive title, grid-paper background, brown window chrome, 5x2 genre grid with retro icons
- The title in the screenshot says "Study Buddy" in cursive — we rename to "Study Smart" in the same style
- Connect Four should feel Apple-esque — light, clean, soft shadows, no dark/gaming aesthetic
- Songdle is intentionally NOT getting a visualizer — the user is happy with the current visual design

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shared/animations.js` + `shared/animations.css`: Phase 3 animation foundation — hover/focus classes, skeleton utilities, scroll reveals, prefers-reduced-motion guard
- `style.css` CSS custom properties: --transition-fast, --transition-normal, --transition-slow
- Connect Four `GameState` class: clean separation of game logic and rendering — redesign only touches rendering
- StudyBuddy `script.js`: pomodoro logic, task CRUD, Chart.js stats, settings persistence — all reusable, only the HTML/CSS skin changes
- Handoff `deployBtn`/`deployStatus`/`deployResult` elements: existing deploy UI hooks to replace with animation

### Established Patterns
- Projects are self-contained: each has its own index.html, script.js, style.css
- Vanilla JS with IIFE pattern (no frameworks except TaskMaster's React/Next.js)
- Chart.js loaded via CDN in StudyBuddy
- Font Awesome icons used in StudyBuddy (CDN)
- Animate.css loaded in StudyBuddy (can be removed if not needed after redesign)

### Integration Points
- StudyBuddy rename: update `projects/studybuddy/` files + `studybuddy/index.html` stub redirect + portfolio shell project card
- Handoff deploy animation: replace content within `deployModal` in `projects/handoff/script.js`
- Songdle SoundCloud: replace audio playback logic in `projects/songdle/script.js` (initAudioForSong, playFallback functions)
- songs.json: add `soundcloudUrl` field to each track entry

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-per-project-polish-redesigns*
*Context gathered: 2026-03-11*
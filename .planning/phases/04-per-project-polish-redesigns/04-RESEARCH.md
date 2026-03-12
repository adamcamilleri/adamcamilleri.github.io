# Phase 4: Per-Project Polish + Redesigns - Research

**Researched:** 2026-03-11
**Domain:** CSS animations, SoundCloud Widget API, retro UI design, vanilla JS drag-and-drop
**Confidence:** HIGH

## Summary

Phase 4 covers four distinct workstreams across four different projects: (1) Handoff rocket deploy animation, (2) Songdle audio fix via SoundCloud Widget API, (3) StudyBuddy-to-Study-Smart full retro OS redesign, and (4) Connect Four visual overhaul with physics-bounce disc drops.

All four projects are vanilla JS with self-contained HTML/CSS/JS files (no build step, no framework). The animation work is purely CSS keyframes + vanilla JS orchestration. The SoundCloud Widget API is well-documented and requires no API key for public tracks. The Study Smart redesign is the largest workstream -- it requires a complete HTML/CSS rewrite, a new drag system, a new music genre grid with streaming audio, and a new quote widget, while preserving all existing functionality (timer, tasks, stats, settings, keyboard shortcuts). Connect Four is the most contained -- it has clean GameState/GameUI separation, so the redesign only touches the UI class and CSS.

**Primary recommendation:** Tackle the four workstreams as separate plans. Study Smart is the largest and should be split into at least two plans (structure/layout + features/music). Use CSS keyframes (not canvas) for the rocket animation. Use vanilla JS pointer events for draggable panels. Use YouTube iframe embeds for the Study Smart music genres (same pattern already proven in Songdle).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Handoff deploy (SIG-01):** Rocket launch animation -- abstract creative, not realistic CI/CD. Stages: energy buildup, launch with trail, rocket rises, clean reveal of live URL with subtle glow. Duration matches real deploy API call (~3-5s). No confetti or starburst. Replaces current "Deploying your site..." text + spinner.
- **Songdle audio fix (SIG-02 revised):** No audio visualizer. Fix audio playback by switching to SoundCloud Widget API (hidden iframe + SC.Widget JS SDK). Iframe is completely hidden. Existing custom play/pause UI controls the widget via SDK. Call seekTo(0) before each play. Pre-populate songs.json with SoundCloud track URLs via build/enrichment script. Do NOT use iTunes/Deezer/Spotify preview APIs. Do NOT use new Audio(soundcloudUrl).
- **Study Smart redesign (REDESIGN-01, 02, 03):** Rename StudyBuddy to "Study Smart". Full retro OS desktop aesthetic. Grid/graph paper background. Warm brown palette (#5C3D2E). Cursive font for title. Retro window chrome with minimize (functional), close/maximize (decorative). Draggable panels. Layout: Timer (left top), To-do list (left bottom), Music genre 5x2 grid (right top), Volume/playback controls (right middle), Inspirational quote widget (right bottom). Music genres replace ambient sounds. Quote widget is new (hardcoded array). All existing features must survive.
- **Connect Four redesign (REDESIGN-04, SIG-03):** Light/clean Apple-esque theme. White/near-white bg (#f8fafc), light gray board (#e2e8f0), red (#dc2626) and gold (#ca8a04) discs. Physics bounce disc drops (~400ms). Glowing line through winning discs + disc glow, non-winning dimmed, green highlight (#16a34a). Column hover: subtle background highlight (no ghost disc). Soft grid lines (#cbd5e1), rounded board container.

### Claude's Discretion
- Rocket launch animation implementation details (CSS vs canvas vs SVG)
- Study Smart panel default positions and responsive behavior on mobile
- How dragging is implemented (CSS transform, drag library, native drag API)
- Music genre audio sources and playback implementation
- Number and selection of inspirational quotes
- Connect Four board rendering approach (CSS Grid vs absolute positioning)
- How to handle Study Smart stats/settings panels (separate windows or integrated)
- SoundCloud track URL enrichment script implementation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIG-01 | Handoff animated deploy progress sequence | CSS keyframe rocket animation pattern, SVG rocket asset, animation-delay chaining for multi-stage sequence |
| SIG-02 | Songdle audio fix (descoped visualizer, SoundCloud Widget API) | SoundCloud Widget API docs (SC.Widget, seekTo, load, READY event), iframe embed pattern, songs.json enrichment |
| SIG-03 | Each project has at least one memorable animation moment | Covered by SIG-01 (Handoff rocket), SIG-02 (Songdle audio fix), REDESIGN-01-04 (Study Smart + Connect Four redesigns) |
| REDESIGN-01 | Rename StudyBuddy to Study Smart + retro OS aesthetic | Google Fonts cursive options, CSS grid-paper background pattern, retro window chrome CSS, warm brown palette |
| REDESIGN-02 | Study Smart panel layout (timer, music, todo, quote, volume) | Vanilla JS draggable panels via pointer events, CSS Grid default layout, YouTube iframe for genre music |
| REDESIGN-03 | Study Smart retains all existing features | Existing code audit: timer (pomodoro/break modes, session counting), tasks (CRUD, search, filter, priority, due dates), stats (Chart.js), settings (localStorage), keyboard shortcuts (Space, R, Enter, Esc) |
| REDESIGN-04 | Connect Four polished modern redesign | CSS cubic-bezier bounce animation, CSS box-shadow glow, SVG line-through overlay, CSS Grid board (already in use) |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS @keyframes | Native | All animations (rocket, disc drop, glow) | No build step, no dependencies, matches project pattern |
| SoundCloud Widget API | Current (api.js) | Songdle audio playback | Official SDK, no API key needed, iframe-based (no CORS issues) |
| Google Fonts | CDN | Cursive title font for Study Smart | Free, fast CDN, no self-hosting needed |
| Chart.js | CDN (existing) | Study Smart stats charts | Already loaded in StudyBuddy, keep as-is |
| Font Awesome | 6.4.0 CDN (existing) | Study Smart icons | Already loaded in StudyBuddy, keep as-is |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| YouTube IFrame API | Existing in Songdle | Study Smart genre music playback | For music genre grid -- same embed pattern already used in Songdle |
| shared/animations.css | Phase 3 | prefers-reduced-motion guard | Import in projects that add new animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS keyframes for rocket | Canvas/WebGL | Overkill for a 3-5s sequence; CSS is simpler, lighter, and sufficient |
| Vanilla JS drag | Draggabilly / interact.js | Extra dependency for a simple use case; pointer events are ~40 lines of vanilla JS |
| YouTube IFrame for genres | SoundCloud playlists | YouTube has more reliable free content availability and the pattern is already proven in songdle |
| CSS bounce for disc drop | Web Animations API | CSS cubic-bezier achieves bounce effect without JS; WAAPI adds complexity for no benefit |

**Installation:**
No npm installs needed. All additions are CDN scripts or native browser APIs.

```html
<!-- SoundCloud Widget API (Songdle only) -->
<script src="https://w.soundcloud.com/player/api.js"></script>

<!-- Google Font for Study Smart cursive title -->
<link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet">
```

## Architecture Patterns

### Recommended Project Structure
```
projects/
  handoff/
    script.js          # Add rocket animation orchestrator to deploy flow
    styles.css         # Add @keyframes for rocket stages
    index.html         # Replace deployStatus/deployResult with rocket animation container
  songdle/
    script.js          # Replace playFallback() with SC.Widget, add hidden iframe
    songs.json         # Add soundcloudUrl field to each track
    index.html         # Add hidden SoundCloud iframe + api.js script
    enrich-soundcloud.js  # Build script to populate soundcloudUrl in songs.json
  studybuddy/
    index.html         # Complete rewrite -- retro OS desktop layout
    styles.css         # Complete rewrite -- retro window chrome, grid paper bg
    script.js          # Refactor: keep logic, add drag system, music grid, quotes
  connect-four/
    index.html         # Minor updates -- add SVG overlay container for win line
    style.css          # Complete rewrite -- Apple-esque theme, bounce animation
    script.js          # Update GameUI: bounce drop, glow win, column hover
```

### Pattern 1: Multi-Stage CSS Animation Sequence (Rocket)
**What:** Chain multiple @keyframes with animation-delay to create a sequential animation
**When to use:** Handoff deploy rocket launch
**Example:**
```css
/* Stage 1: Energy buildup - glow intensifies */
@keyframes rocket-charge {
  0% { filter: brightness(1); transform: scale(1); }
  100% { filter: brightness(1.3); transform: scale(1.05); }
}

/* Stage 2: Launch with trail */
@keyframes rocket-launch {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-200px); opacity: 0; }
}

/* Stage 3: URL reveal */
@keyframes url-reveal {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.rocket-charging { animation: rocket-charge 1s ease-in-out forwards; }
.rocket-launching { animation: rocket-launch 1.5s ease-in forwards; }
.url-revealing { animation: url-reveal 0.5s ease-out forwards; }
```

**JS orchestration:** Use the deploy fetch promise. Start animation on click, advance stages with setTimeout, accelerate if API resolves early.

### Pattern 2: SoundCloud Widget Hidden Iframe
**What:** Hidden iframe controlled by SC.Widget SDK
**When to use:** Songdle audio playback replacement
**Example:**
```html
<!-- Hidden iframe - 0x0 with position absolute off-screen -->
<iframe id="scWidget" width="0" height="0"
  allow="autoplay"
  src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293"
  style="position:absolute;left:-9999px;">
</iframe>
<script src="https://w.soundcloud.com/player/api.js"></script>
```
```javascript
var scWidget = SC.Widget('scWidget');

// Load a new track
scWidget.load('https://api.soundcloud.com/tracks/' + trackId, {
  auto_play: false,
  callback: function() {
    // Track loaded, ready to play
  }
});

// Play from beginning
scWidget.seekTo(0);
scWidget.play();

// Stop after clip duration
setTimeout(function() { scWidget.pause(); }, clipDuration * 1000);
```

### Pattern 3: Vanilla JS Draggable Panels (Pointer Events)
**What:** Make positioned elements draggable with mousedown/mousemove/mouseup
**When to use:** Study Smart desktop panels
**Example:**
```javascript
function makeDraggable(panel) {
  var titleBar = panel.querySelector('.window-titlebar');
  var offsetX, offsetY;

  titleBar.addEventListener('pointerdown', function(e) {
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
    panel.style.zIndex = ++zCounter; // Bring to front

    function onMove(e) {
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}
```

### Pattern 4: CSS Physics Bounce (Connect Four Disc Drop)
**What:** Cubic-bezier curve that simulates bounce on landing
**When to use:** Connect Four disc drop animation
**Example:**
```css
@keyframes disc-drop {
  0%   { transform: translateY(-400%); }
  50%  { transform: translateY(0); }
  65%  { transform: translateY(-15%); }
  80%  { transform: translateY(0); }
  90%  { transform: translateY(-5%); }
  100% { transform: translateY(0); }
}

.disc.dropping {
  animation: disc-drop 400ms ease-out forwards;
}
```

### Anti-Patterns to Avoid
- **innerHTML with user content:** StudyBuddy script.js uses innerHTML in several places (session counter, task rendering). The redesign must use DOM APIs (createElement, textContent) per project security rules.
- **Hardcoded audio URLs:** StudyBuddy currently hardcodes mixkit URLs for ambient sounds. The new music system should use a data structure (genre config array) rather than scattered URL strings.
- **Animating layout properties:** Use transform and opacity for animations, not top/left/width/height, to avoid layout thrashing.
- **Blocking animation on API response:** The rocket animation should start immediately on click, not wait for the deploy API response. The API result controls when the animation transitions to the final "success" stage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio playback from SoundCloud | Direct Audio() fetch with CORS workarounds | SoundCloud Widget API (SC.Widget) | SoundCloud blocks CORS on direct audio URLs. The iframe widget is the official way. |
| Draggable panels with resizing | Full window manager from scratch | Pointer events drag (position only, no resize) | Minimize is functional, but resize is not specified. Keep scope small. |
| Music streaming for genres | Custom audio streaming server | YouTube IFrame API (already in Songdle) or SoundCloud playlist embeds | Free, reliable, no backend needed |
| SVG rocket illustration | Drawing rocket from scratch in code | Simple SVG asset (inline) with CSS animation | A few path elements for a rocket silhouette, animated with CSS transforms |
| Bounce physics | requestAnimationFrame physics engine | CSS @keyframes with manual bounce keyframes | For a single disc drop, CSS keyframes are simpler and more performant |

**Key insight:** Every project in this repo is vanilla JS with no build step. All solutions must work as plain HTML/CSS/JS loaded via `<script>` tags or CDN links. No npm imports, no bundlers, no transpilation.

## Common Pitfalls

### Pitfall 1: SoundCloud Widget CORS and Autoplay
**What goes wrong:** Browsers block autoplay of iframe audio without user interaction. SC.Widget.play() called programmatically may be silently ignored.
**Why it happens:** Browser autoplay policies require a user gesture (click/tap) in the call stack.
**How to avoid:** Only call scWidget.play() inside a click event handler (the existing playBtn click handler). The `allow="autoplay"` attribute on the iframe helps but is not sufficient alone.
**Warning signs:** Play button click does nothing, no error in console.

### Pitfall 2: SoundCloud Track Availability
**What goes wrong:** SoundCloud tracks get taken down, made private, or geo-blocked. The widget fails silently or shows "This track is not available."
**Why it happens:** Music licensing. Public tracks can become private at any time.
**How to avoid:** The enrichment script should validate each URL. Include a fallback: if SC widget fails, fall back to YouTube path (already exists in Songdle). Log SC.Widget.Events.ERROR to detect failures.
**Warning signs:** Widget loads but shows error, no audio plays.

### Pitfall 3: StudyBuddy Feature Regression
**What goes wrong:** Redesigning the HTML/CSS breaks existing JS functionality because selectors change.
**Why it happens:** The script.js relies on specific DOM structure (querySelector('.sound-options'), getElementById('taskList'), etc.).
**How to avoid:** Map ALL existing DOM selectors from script.js before starting the redesign. Preserve IDs and class names that JS depends on, or update both HTML and JS in lockstep. Test each feature after the redesign.
**Warning signs:** Timer doesn't start, tasks don't save, stats don't render, sounds don't play.

### Pitfall 4: Rocket Animation Timing vs API Response
**What goes wrong:** Animation finishes before API responds (user sees success too early) or API finishes instantly but animation is still mid-flight (user waits for no reason).
**Why it happens:** Deploy API call takes variable time (1-10s). Fixed animation duration can't match.
**How to avoid:** Design animation as a loop in the middle stage (rocket rises with repeating trail). When API resolves: if animation hasn't reached a good transition point, accelerate to the final stage; if API failed, show error state instead of success.
**Warning signs:** URL appears while rocket is still mid-screen, or rocket finishes but URL doesn't appear.

### Pitfall 5: Draggable Panels on Mobile
**What goes wrong:** Drag-to-move doesn't work well on touch devices because touch-move is used for scrolling.
**Why it happens:** Browser reserves touchmove for scroll. Calling preventDefault() on the title bar's touchmove prevents scrolling but may cause issues.
**How to avoid:** On mobile (narrow viewports), disable dragging and use a stacked/scrollable layout instead. Use a media query or JS check for viewport width. Pointer events work on both mouse and touch, but add touch-action: none on the title bar only.
**Warning signs:** Panels can't be dragged on phones, or page can't be scrolled when touching a panel.

### Pitfall 6: Connect Four Dark Mode Override
**What goes wrong:** The existing CSS has a `@media (prefers-color-scheme: dark)` block that overrides colors. The new Apple-esque light theme gets overridden by dark mode.
**Why it happens:** The redesign targets a specific light palette but doesn't account for the existing dark mode media query.
**How to avoid:** Remove or restyle the dark mode media query as part of the redesign. The locked decision specifies a light/clean theme with specific hex values -- this should be the only theme.
**Warning signs:** Board appears dark blue on systems with dark mode enabled.

## Code Examples

### SoundCloud Widget Integration for Songdle
```javascript
// In songdle/script.js, replace playFallback and modify playClip

var scWidget = null;
var scReady = false;

// Initialize after DOM ready
function initSoundCloudWidget() {
  var iframe = document.getElementById('scWidget');
  if (!iframe || typeof SC === 'undefined') return;
  scWidget = SC.Widget(iframe);
  scWidget.bind(SC.Widget.Events.READY, function() {
    scReady = true;
  });
  scWidget.bind(SC.Widget.Events.ERROR, function() {
    // Fallback to YouTube path
    console.warn('SoundCloud widget error, falling back to YouTube');
  });
}

// Load a song's SoundCloud track
function loadSoundCloudTrack(song) {
  if (!scWidget || !scReady || !song.soundcloudUrl) return false;
  scWidget.load(song.soundcloudUrl, {
    auto_play: false,
    show_artwork: false,
    callback: function() {
      // Ready to play
    }
  });
  return true;
}

// Play clip from beginning
function playSoundCloudClip(duration) {
  scWidget.seekTo(0);
  scWidget.play();
  // Stop after clip duration
  clearTimeout(ytClipTimer);
  ytClipTimer = setTimeout(function() {
    scWidget.pause();
    setPlayIcon(false);
  }, duration * 1000);
}
```

### songs.json SoundCloud URL Format
```json
{
  "id": "1406109901",
  "name": "In My Feelings",
  "artist": "Drake",
  "genre": "hip-hop",
  "preview_url": "https://audio-ssl.itunes.apple.com/...",
  "spotifyId": "2G7V7zsVDxg1yRsu7Ew9RJ",
  "youtubeId": "SD1tkI5-3dI",
  "soundcloudUrl": "https://api.soundcloud.com/tracks/XXXXXXX",
  "startOffset": 2
}
```

### Retro Window Chrome HTML Pattern
```html
<div class="desktop-panel" id="timerPanel" style="left:40px;top:40px;">
  <div class="window-titlebar">
    <div class="window-buttons">
      <span class="window-btn close"></span>
      <span class="window-btn minimize" data-panel="timerPanel"></span>
      <span class="window-btn maximize"></span>
    </div>
    <span class="window-title">Timer</span>
  </div>
  <div class="window-body">
    <!-- Timer content here -->
  </div>
</div>
```

### Connect Four Winning Line SVG Overlay
```html
<div class="board-container" style="position:relative;">
  <div class="board-grid"><!-- slots --></div>
  <svg class="win-line-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">
    <line class="win-line" x1="0" y1="0" x2="0" y2="0"
      stroke="#16a34a" stroke-width="4" stroke-linecap="round"
      stroke-dasharray="500" stroke-dashoffset="500"/>
  </svg>
</div>
```
```css
.win-line.animate {
  animation: draw-line 0.6s ease-out forwards;
}
@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SoundCloud HTTP API (client_id) | SoundCloud Widget API (iframe, no key) | ~2020 (client_id registration closed) | Widget API is the only reliable free way to play SC audio |
| jQuery UI draggable | Vanilla JS pointer events | Modern browsers | Zero dependencies, works on touch and mouse |
| JavaScript animation (setInterval) | CSS @keyframes + Web Animations API | ~2018+ | GPU-accelerated, declarative, respects prefers-reduced-motion via CSS |
| Separate Audio element for SoundCloud | Hidden iframe widget | Always (for SC) | Direct Audio() is CORS-blocked; iframe is the official approach |

**Deprecated/outdated:**
- Animate.css (currently loaded in StudyBuddy): Can be removed in the redesign. Replace with custom CSS keyframes that match the retro aesthetic.
- Web Audio API for ambient sounds (currently in StudyBuddy): Replaced by YouTube IFrame embeds for genre music. Web Audio API fetch+decode pattern had reliability issues.
- Preview APIs (iTunes/Deezer): Serve mid-song clips, not full tracks from the start.

## Open Questions

1. **Music genre audio sources for Study Smart**
   - What we know: Need 10 genres (Lo-Fi, Jazz, Piano, Classical, Acoustic, Kalimba, K-Pop, Cafe, Library, Nature). YouTube IFrame API is proven in this codebase. SoundCloud playlists are another option.
   - What's unclear: Specific YouTube video IDs or SoundCloud playlist URLs for each genre's looping background music.
   - Recommendation: Use YouTube IFrame API (same as Songdle). Curate one long-play video per genre (e.g., "lo-fi beats to study to" type videos). Store video IDs in a config array in the script. The iframe can be hidden (1x1px, same as Songdle's ytPlayer). If a video gets taken down, the genre just shows as unavailable -- easy to update the config.

2. **SoundCloud track URLs for songs.json enrichment**
   - What we know: Need to add `soundcloudUrl` field to each song in songs.json. SoundCloud search API requires an API key, but track page URLs are public.
   - What's unclear: Best approach for the enrichment script -- scraping search results vs manual curation vs an API.
   - Recommendation: Build a Node.js script that uses SoundCloud's oEmbed endpoint (no auth needed) to resolve `https://soundcloud.com/artist/track-name` URLs into embed URLs. The script takes artist+title from songs.json, constructs a probable SoundCloud URL, and validates it via oEmbed. Manual fallback for tracks that don't resolve.

3. **Study Smart responsive/mobile layout**
   - What we know: Panels are draggable on desktop. Mobile touch-drag conflicts with scrolling.
   - What's unclear: Exact breakpoint and fallback layout.
   - Recommendation: Below 768px, disable dragging, stack panels vertically in a scrollable layout. Keep the retro chrome styling but use CSS Grid for consistent stacking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + Cypress 13 |
| Config file | package.json (jest config) / cypress.config.js |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIG-01 | Rocket animation stages trigger on deploy click | e2e | `npx cypress run --spec cypress/e2e/handoff.cy.js` | Partial (handoff.cy.js exists but no deploy animation tests) |
| SIG-02 | SoundCloud widget loads, seekTo(0) called, clip plays for correct duration | unit | `npx jest __tests__/songdle-playback.test.js` | Partial (songdle-playback.test.js exists but tests old Audio path) |
| SIG-03 | Covered by SIG-01 + SIG-02 + REDESIGN-04 | - | - | - |
| REDESIGN-01 | Title says "Study Smart", all references updated | e2e/manual | Manual verification | No |
| REDESIGN-02 | Panels render in correct layout, draggable on desktop | manual-only | Manual verification (drag interactions are hard to automate without Cypress drag plugin) | No |
| REDESIGN-03 | Timer, tasks, stats, settings, shortcuts all work after redesign | e2e | Manual or new Cypress spec | No |
| REDESIGN-04 | Disc drops with bounce, winning line glows, column hover highlights | manual-only | Manual verification (visual animation correctness) | No |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/songdle-soundcloud.test.js` -- covers SIG-02 (SC.Widget mock, seekTo call verification)
- [ ] Update `__tests__/songdle-playback.test.js` -- adapt existing tests for new SC.Widget path
- [ ] Manual test checklist for Study Smart feature regression (REDESIGN-03) -- timer modes, task CRUD, search, filter, stats Chart.js, settings persistence, keyboard shortcuts

## Sources

### Primary (HIGH confidence)
- [SoundCloud Widget API docs](https://developers.soundcloud.com/docs/api/html5-widget) -- full method/event reference, iframe embed pattern, seekTo/load/play/pause
- [SoundCloud Widget-JS-API GitHub](https://github.com/soundcloud/Widget-JS-API) -- official SDK source
- Existing codebase: projects/songdle/script.js (YouTube IFrame pattern), projects/studybuddy/script.js (all existing features audited), projects/connect-four/script.js (GameState/GameUI class structure)

### Secondary (MEDIUM confidence)
- [MDN @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes) -- CSS keyframes specification
- [CSS Rocket Animation with SVGs](https://launchpadlab.com/blog/rocket-animation-css-animations-with-svgs/) -- SVG + CSS animation pattern for rocket
- [DigitalOcean vanilla JS drag and drop tutorial](https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js) -- pointer event drag pattern
- [SoundCloud Developer Guide (2025)](https://ymlogy.xyz/posts/2025-04-27-dev-guide-soundcloud/) -- current state of SoundCloud APIs

### Tertiary (LOW confidence)
- Music genre YouTube video IDs -- will need manual curation, no authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all technologies are native browser APIs or well-documented SDKs already in use in this project
- Architecture: HIGH -- patterns follow existing codebase conventions (vanilla JS IIFE, self-contained project dirs, CDN scripts)
- Pitfalls: HIGH -- identified from direct code audit (innerHTML usage, DOM selector dependencies, dark mode override, autoplay policy)
- SoundCloud integration: HIGH -- official docs fetched, API surface documented, pattern matches known working approach (Heardle used same technique)
- Study Smart music sources: MEDIUM -- YouTube IFrame is proven in codebase but specific video IDs need curation
- Enrichment script: LOW -- SoundCloud oEmbed may not resolve all tracks; manual fallback likely needed

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable technologies, 30-day validity)

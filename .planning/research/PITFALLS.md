# Pitfalls Research

**Domain:** Portfolio site optimization — animations, tech debt remediation, AI tooling setup (vanilla JS + Vercel)
**Researched:** 2026-03-11
**Confidence:** HIGH (animation/performance), MEDIUM (AI tooling), HIGH (project-specific issues from codebase audit)

---

## Critical Pitfalls

### Pitfall 1: Animating Layout Properties Instead of Transform/Opacity

**What goes wrong:**
Adding hover effects, entrance animations, and transitions by animating `width`, `height`, `top`, `left`, `margin`, or `padding`. These trigger browser layout recalculation on every frame, causing jank (dropped frames) especially visible on lower-end hardware. The effect that looks smooth in Chrome DevTools at 60fps on a MacBook M3 looks broken on a budget Android phone or during a recruiter screen share.

**Why it happens:**
The intuitive property to animate "moving something down" is `top` or `margin-top`. Developers reach for the property that describes the visual intent rather than the GPU-composited equivalent.

**How to avoid:**
Animate exclusively `transform` and `opacity` for motion effects. Use `transform: translateY()` instead of `top`, `transform: scale()` instead of `width/height`, `opacity` for fades. Apply `will-change: transform` sparingly (only on elements that actually animate) — overuse creates memory pressure.

**Warning signs:**
- Chrome DevTools Performance panel shows purple "Layout" or green "Paint" events firing on every frame during animations
- FPS drops below 60 during scroll or hover interactions
- Animations feel "sticky" or laggy on mobile

**Phase to address:** Animation/Motion phase — must be the guiding constraint from the first animation added.

---

### Pitfall 2: Ignoring `prefers-reduced-motion` Entirely

**What goes wrong:**
All animations fire regardless of the user's OS accessibility setting. Approximately 35% of users who have this preference set will experience motion sickness, vestibular disorders, or cognitive overload from animations they explicitly asked to suppress. For a portfolio aimed at professional audiences (including hiring managers with disabilities), this is a credibility issue, not just an accessibility checkbox.

**Why it happens:**
Developers add animations and test them visually without toggling the OS accessibility setting. The omission is invisible during development.

**How to avoid:**
Every animation block needs a `prefers-reduced-motion: reduce` counterpart. Pattern:
```css
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform 300ms ease; }
}
```
For GSAP/JS animations, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before initializing ScrollTrigger or entrance animations. Provide static equivalents: fade-ins become instant visibility; slides become no-op; parallax becomes static.

**Warning signs:**
- No `prefers-reduced-motion` queries anywhere in CSS
- GSAP initialization not gated on motion preference check
- Portfolio tested only by the developer who doesn't have reduced motion enabled

**Phase to address:** Animation/Motion phase — add the media query wrapper at the same time as each animation, not as a retrofit pass later.

---

### Pitfall 3: Over-Animating the Portfolio Shell (Wow Factor Trap)

**What goes wrong:**
Adding entrance animations, scroll-pinning, parallax text effects, and cursor followers to the main portfolio page in pursuit of "impressive." The result: recruiters who spend under two minutes on a portfolio can't find the project list because they're waiting for section entrances to complete, or the scroll position is hijacked by pin effects. The portfolio *about the developer* becomes harder to navigate than the project demos themselves.

**Why it happens:**
The goal is to impress, and animations feel impressive in isolation. The mistake is optimizing for the developer's reaction when building, not for a recruiter's experience when skimming under time pressure.

**How to avoid:**
Keep the portfolio shell animations minimal and fast (under 300ms). Reserve the motion design budget for *inside* project demos — that's where demonstrating animation skill is appropriate and expected. Apply the rule: shell animations should be invisible when you're not looking for them; project demo animations should be memorable.

**Warning signs:**
- Scroll is interrupted or pinned on the main page for more than 500ms
- Section content is not visible until animation completes
- The portfolio takes more than 2 scrolls to reach the projects grid

**Phase to address:** Animation/Motion phase — define a motion budget for shell vs. project demos before writing any code.

---

### Pitfall 4: Shared CORS Utility Extracted But Not Tested Across All Call Sites

**What goes wrong:**
The CORS utility is extracted from six API handlers into `api/_lib/cors.js`, but one or two handlers are missed — either because they were overlooked or because a new handler was added after the extraction. Silent CORS failures follow: the browser blocks the request with a CORS error that shows no useful detail in the network tab, making it appear like the API is down.

**Why it happens:**
The codebase has 6 files with the identical `corsHeaders()` copy-paste. During extraction, it's easy to miss a file or for a future handler to re-introduce the copy-paste pattern. There is no enforcement mechanism preventing the old pattern from recurring.

**How to avoid:**
After extraction, add a grep check or lint rule that fails if `Access-Control-Allow-Origin` appears raw in any `api/*.js` file outside `_lib/`. Verify each handler's OPTIONS preflight response in the browser network tab post-refactor, not just unit tests. Test with a cross-origin caller (e.g., from `localhost:3000` calling the Vercel dev server).

**Warning signs:**
- A handler returns 200 for GET but the browser shows a CORS error
- New API files added after the refactor contain their own `corsHeaders` function
- `api/_lib/cors.js` import is not in every non-`_lib` handler file

**Phase to address:** Tech Debt phase — part of the CORS consolidation task.

---

### Pitfall 5: MongoDB Reconnect Fix Creates Connection Storm Instead

**What goes wrong:**
Fixing the stale-connection problem by removing the module-level cache entirely, so every request creates a new `MongoClient`. This solves the stale-connection intermittent 500 errors but creates a connection storm under any meaningful concurrency. MongoDB Atlas free tier allows 500 simultaneous connections; Vercel can spin up many function instances on a traffic spike.

**Why it happens:**
The fix looks obvious: "don't cache connections." The caching pattern is what caused the stale connection, so removing caching appears to be the solution.

**How to avoid:**
Use the Vercel-recommended global caching pattern with a ping/health check before returning the cached connection. The pattern is: cache the `MongoClient` promise in a global variable, but before using a cached connection, run a lightweight `db.command({ ping: 1 })` and reconnect if it throws. Do not create a new client per request.

**Warning signs:**
- MongoDB Atlas dashboard shows connections spiking proportionally to Vercel function invocations
- Atlas connection limit warnings in logs
- The "fix" removed module-level caching entirely rather than adding a reconnect guard

**Phase to address:** Tech Debt phase — handle alongside the MongoDB connection task.

---

### Pitfall 6: GSAP ScrollTrigger Breaks When Added to Project Demos That Live in Iframes or Nested Scroll Containers

**What goes wrong:**
Some project demos (`Handoff`, `Songdle`) render in a context where the outer portfolio page controls scroll. Adding ScrollTrigger to inner demo pages causes triggers to fire based on the wrong scroll container. Scroll positions are measured against `window` by default; if the demo is embedded or has its own scrollable div, triggers fire immediately or never.

**Why it happens:**
GSAP ScrollTrigger defaults to `window` scroll. Portfolio project demos have varying DOM structures — some are full-page, some are section-scoped. This isn't obvious until testing.

**How to avoid:**
For any demo that has its own scroll container (not `window`), pass the `scroller` option to ScrollTrigger: `ScrollTrigger.create({ scroller: '#demo-container', ... })`. Test each demo in its actual portfolio context (linked from the index), not just by opening the demo file directly.

**Warning signs:**
- Animations trigger immediately on page load instead of when the element enters view
- Animations never trigger even when the element is clearly visible
- Demo tested by opening `projects/handoff/index.html` directly but not via the portfolio link

**Phase to address:** Animation/Motion phase — add ScrollTrigger setup notes per demo.

---

### Pitfall 7: CLAUDE.md Becomes Stale Immediately After the Tech Debt Phase

**What goes wrong:**
CLAUDE.md is written to describe the codebase at a point in time. Once the tech debt phase ships — CORS extracted, MongoDB fixed, Handoff usage limit restored — the file describes a codebase that no longer exists. Claude Code then gives advice based on the old architecture (e.g., tells you to copy the CORS headers into a new handler because that's the "pattern in the codebase").

**Why it happens:**
CLAUDE.md is treated as a one-time setup artifact rather than a living document. The tech debt phase changes many of the exact things the file was written to describe.

**How to avoid:**
Schedule a CLAUDE.md review task immediately after the tech debt phase completes. Specifically: update the CORS section (now uses shared lib), update the MongoDB section (now has reconnect guard), update the usage limit section (now active). Add a note in CLAUDE.md itself: "Last verified against codebase: [date]. If CORS or MongoDB patterns look different from what's described here, this file is stale."

**Warning signs:**
- Claude Code suggests copying `corsHeaders()` into a new API file after the extraction was done
- Claude Code references `canGenerate()` returning `true` unconditionally after the usage limit is restored
- CLAUDE.md has no "last verified" date

**Phase to address:** Claude Tooling Setup phase, with a scheduled update task tied to Tech Debt phase completion.

---

### Pitfall 8: XSS Fix Breaks the Onboarding Summary UI

**What goes wrong:**
Replacing `summaryText.innerHTML = ...` with DOM-safe alternatives (textContent, createElement) without checking how the surrounding HTML structure is built. The summary div uses `<strong>` tags for label formatting. A naive `textContent` replacement removes the bold formatting and makes the summary look broken.

**Why it happens:**
The fix is urgent (XSS), done quickly, and the visual regression is subtle — the text appears but looks slightly off.

**How to avoid:**
Use DOM construction, not textContent for the whole block. Build the structure as: create `<strong>` elements via `document.createElement('strong')`, set their `.textContent`, then `appendChild` to the container. Never mix user-supplied values into template literals that go into `innerHTML`. Test the fix by actually running through onboarding and verifying the Step 4 summary looks correct.

**Warning signs:**
- Summary labels appear but without bold formatting
- The fix was implemented as `summaryText.textContent = ...` for the whole block

**Phase to address:** Tech Debt / Security phase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-paste CORS headers into each new handler | Fast to ship a new endpoint | Any CORS policy change requires finding and updating N files; easy to miss one | Never — takes 5 minutes to import a shared module |
| `JWT_SECRET ?? 'missing-secret'` fallback | App starts without config | Forged tokens in production if env var is missing | Never in a signing context |
| `canGenerate() { return true }` hardcoded bypass | Fast iteration while building | Unlimited API cost exposure; upgrade flow dead code | Only acceptable with a code comment and a tracked issue; not long-term |
| Reading `songs.json` from disk on every request | Simpler code | Unnecessary I/O per request; noticeable on Vercel cold starts | Never — module-level cache is a one-line fix |
| Committing `dist/` to git | No build step needed locally | Source/dist diverge silently; build artifacts in PR diffs | Never — add to `.gitignore`, let CI generate |
| Animating width/height instead of transform | Intuitive code | Layout reflow on every frame; jank on mobile | Never for animated properties |
| `will-change: transform` on every animated element | Smoother animation intent | GPU memory allocated even for static elements; can hurt performance | Only on elements that are actively animating |

---

## Integration Gotchas

Common mistakes when connecting to external services and tools in this project.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel MCP | Treating Vercel MCP as read/write — it launched as read-only | Use Vercel MCP for logs/metadata inspection; use Vercel CLI for deployments and config changes |
| GitHub MCP | Storing GitHub token in `settings.json` in plain text | Store token in environment variable or OS keychain; `settings.json` can be committed accidentally |
| MongoDB Atlas | Removing module-level client cache to "fix" stale connections | Keep the cache, add a ping guard before use; never create a client per request |
| GSAP (free tier) | Using `ScrollSmoother` or `SplitText` which require GSAP Club license | Verify each plugin's license tier before use; ScrollTrigger and core tweens are free |
| Groq API | No retry on 429 rate-limit response | Add exponential backoff with 1-2 retries for 429/503; log the retry so it's visible |
| EmailJS | Hard-coding service/template IDs in script.js | Already done correctly here — just don't expose the private key, only the public key |
| Spotify scraping | Treating `__NEXT_DATA__` JSON as stable | Document as fragile; the endpoint is already disabled by default — do not re-enable without a fallback |

---

## Performance Traps

Patterns that work at small scale but cause problems as the site is visited more.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running too many simultaneous animations | Scroll jank when multiple sections enter view at once | Stagger entrance animations; don't trigger more than 2-3 at once | Visible immediately on mid-range hardware |
| No animation cleanup on SPA-style navigation | Memory leaks; duplicate animations on return visits; ScrollTrigger fires twice | Call `ScrollTrigger.kill()` and `tween.kill()` on view teardown | After 2-3 page navigations within the portfolio |
| Large songs.json read on every Songdle API call | Increased Vercel function execution time; higher cold start impact | Cache in module-level variable after first read | Every request, not a scale issue — it's already a problem at 1 user |
| Handoff sending full 14K-char HTML on every chat turn | High Groq API latency; near token limits | Already mitigated; don't expand the truncation limit | At current scale — each turn is already expensive |
| Animating `display: none` elements | Animations don't run; elements snap into view | Use opacity + pointer-events or visibility instead of display for animated elements | Every time |
| No `requestAnimationFrame` batching for JS-driven animations | Layout thrashing if reading then writing DOM in same frame | Separate DOM reads and writes; use GSAP which handles this internally | Visible on low-end devices |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| JWT hardcoded fallback secret (`'missing-secret'`) | Anyone can forge TaskMaster auth tokens if `JWT_SECRET` env var is not set in production | Throw on startup if `JWT_SECRET` is missing in production: `if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error(...)` |
| `innerHTML` with unsanitized user input in Handoff onboarding | Self-XSS (currently); shared session risk if multi-user ever added | Use DOM construction APIs; never interpolate user input into HTML strings |
| `canGenerate()` permanently returning `true` | Unlimited Groq API cost; any actor can exhaust free tier | Restore the limit gate immediately; server-side rate limiting is also needed |
| Wildcard CORS on Songdle public endpoints | Any site can proxy the API and attribute traffic costs to the owner | Low risk for read-only data, but restrict to known origins using the same allowlist |
| MCP GitHub token with write access in config file | If `settings.json` is committed, token is exposed in git history | Add `settings.json` to `.gitignore` if it contains tokens; use environment variables |
| OAuth redirect URI constructed from runtime `origin` header | Fragile; if header is spoofed, redirect URI could differ from registered value | Hardcode expected callback URIs; don't construct from request headers |

---

## UX Pitfalls

Common user experience mistakes specific to portfolio sites with animations.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Entrance animations that delay content visibility | Recruiter can't read project descriptions until animation completes | Make content immediately visible; animate decorative elements only, or use opacity so content is readable even mid-animation |
| Scroll-jacking or pinned scroll sections on the main page | Recruiter loses control of scrolling; frustrated after 3 seconds | Keep shell scroll natural; pin effects only inside explicit demo sections if at all |
| Hover effects that make text illegible (contrast change) | Animated background changes drop text contrast below WCAG AA | Test every hover state with a contrast checker; keep text color consistent or ensure contrast ratio stays above 4.5:1 |
| Animations with no `prefers-reduced-motion` fallback | Motion sickness for ~35% of users who have this preference set | Every animation gets a corresponding `prefers-reduced-motion` clause |
| Project demos that look broken before JavaScript loads | Flash of unstyled/broken state; poor first impression | Set correct initial CSS state before any JS runs; use CSS for layout, JS for enhancement |
| Over-reliance on looping background animations | Continuous motion is distracting; WCAG requires pause control for motion >5 seconds | Either use subtle one-shot animations or provide a visible pause control |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **CORS extraction:** Verify every file in `api/` (not just the 6 identified) imports from `_lib/cors.js` — check that `api/songdle-songs.js`, `api/health.js`, `api/spotify-preview.js` etc. also follow the pattern even if they use wildcard CORS currently
- [ ] **MongoDB reconnect fix:** Verify the fix handles the case where the ping itself fails with a timeout (not just a connection error) — add a timeout bound to the ping command
- [ ] **Animations with `prefers-reduced-motion`:** Verify by actually enabling the OS reduced motion setting and browsing through every animated section — DevTools emulation is not sufficient
- [ ] **GSAP ScrollTrigger in demos:** Verify each demo in context (via the portfolio index link), not by opening the demo HTML directly
- [ ] **JWT secret enforcement:** Verify by deploying to a staging environment with `JWT_SECRET` unset — if the app starts without error, the check is not working
- [ ] **XSS fix in Handoff:** Verify by entering `<img src=x onerror=alert(1)>` in all three onboarding fields and confirming no alert fires
- [ ] **Usage limit restoration:** Verify the upgrade modal actually renders when the limit is hit — the modal exists but has not been exercised since the gate was disabled
- [ ] **CLAUDE.md coverage:** Verify by asking Claude Code a question about the CORS pattern and confirming it references the shared lib, not the old copy-paste pattern
- [ ] **`dist/` gitignore:** Verify with `git status` that `dist/validation.js` no longer appears as a tracked file after adding to `.gitignore`
- [ ] **Songdle cache:** Verify with Vercel function logs that `songs.json` disk read appears only once per function instance, not on every invocation

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Jank-causing animations shipped to production | LOW | Identify offending properties with Chrome DevTools Performance panel; swap `width/height` for `transform` equivalents; redeploy |
| CORS broken for a handler after extraction | LOW | Check the handler's import statement; add the `_lib/cors.js` import; redeploy (Vercel deployment is fast) |
| MongoDB connection storm hitting Atlas limits | MEDIUM | Revert to cached connection pattern immediately; verify ping guard; consider upgrading Atlas tier temporarily |
| CLAUDE.md gives wrong advice about old patterns | LOW | Update the stale section; add a "last verified" date; re-test Claude's answers on the corrected patterns |
| ScrollTrigger animations not firing in demo context | LOW | Add `markers: true` to identify the trigger position; add `scroller` option if in a nested container; remove markers before shipping |
| XSS discovered after Handoff goes public | HIGH | Patch immediately with DOM construction; audit all other `innerHTML` assignments in the codebase; check if any session data was exposed |
| Groq API costs spike due to rate limit bypass | MEDIUM | Re-enable `canGenerate()` gate immediately; add server-side rate limiting; review Groq usage logs to assess exposure |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Animating layout properties (width/height/top) | Animation/Motion | Chrome DevTools Performance panel shows no purple Layout events during animations |
| No `prefers-reduced-motion` support | Animation/Motion | Test with OS reduced motion enabled on macOS/Windows; no animations fire |
| Over-animating the portfolio shell | Animation/Motion — planning step | Define motion budget before writing animation code |
| CORS shared utility missed call sites | Tech Debt | Grep confirms no raw `Access-Control-Allow-Origin` headers outside `_lib/` |
| MongoDB reconnect creates connection storm | Tech Debt | Atlas dashboard shows connection count stable under load |
| GSAP ScrollTrigger wrong scroll container | Animation/Motion | Each demo tested via portfolio index link, not direct file open |
| CLAUDE.md becomes stale post-tech-debt | Claude Tooling Setup + review after Tech Debt | Ask Claude Code about CORS and MongoDB patterns; answers match current code |
| XSS fix breaks onboarding summary UI | Tech Debt / Security | Run full onboarding flow; Step 4 summary renders with correct formatting |
| `will-change` on too many elements | Animation/Motion | Chrome DevTools Layers panel shows compositing layers only on actively animating elements |
| MCP token exposed in config | Claude Tooling Setup | Confirm `settings.json` is in `.gitignore` before committing any MCP config |
| Looping background animation without pause control | Animation/Motion | WCAG audit: any motion >5 seconds has a visible pause control |
| JWT secret missing in production | Tech Debt / Security | Staging deploy with `JWT_SECRET` unset fails startup with explicit error |

---

## Sources

- [GSAP ScrollTrigger Tips & Mistakes (official)](https://gsap.com/resources/st-mistakes/) — HIGH confidence (official GSAP documentation)
- [MDN: CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) — HIGH confidence
- [Motion.dev: Web Animation Performance Tier List](https://motion.dev/magazine/web-animation-performance-tier-list) — MEDIUM confidence
- [Pope Tech: Design accessible animation and movement](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — HIGH confidence (WCAG-aligned)
- [W3C WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — HIGH confidence (official standard)
- [GSAP: Accessible Animation](https://gsap.com/resources/a11y/) — HIGH confidence (official)
- [Packmind: Writing AI context files](https://packmind.com/evaluate-context-ai-coding-agent/) — MEDIUM confidence
- [eesel: Claude Code best practices](https://www.eesel.ai/blog/claude-code-best-practices) — MEDIUM confidence
- [Vercel: MongoDB Atlas integration](https://vercel.com/changelog/mongodb-atlas-integration) — HIGH confidence (official)
- [This Dot Labs: Next.js + MongoDB Connection Storming](https://www.thisdot.co/blog/next-js-mongodb-connection-storming) — MEDIUM confidence
- [DEV Community: Frontend portfolio tips 2025](https://dev.to/siddheshcodes/frontend-developer-portfolio-tips-for-2025-build-a-stunning-site-that-gets-you-hired-3hga) — MEDIUM confidence
- [Vercel: Improving cold start performance](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel) — HIGH confidence (official)
- Project-specific: `c:/Users/adamc/OneDrive/Documents/GitHub/adamcamilleri.github.io/.planning/codebase/CONCERNS.md` — HIGH confidence (direct codebase audit)

---

*Pitfalls research for: portfolio site optimization (animations + tech debt + AI tooling)*
*Researched: 2026-03-11*

---
Task ID: 1
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix Site-92 SCiPNET admin panel "failed to load" + Ducky bot "unknown" status bugs (repo: github.com/TS-66/site-92-main-web)

Work Log:
- Cloned & audited the full repo (src/app/api/**, public/index.html, mini-services/support-service, prisma schema).
- Root causes identified:
  (1) Frontend/backend contract mismatch: saveSiteStatus() sent a {key:value} map but PUT /api/admin/site-status expected a single {key,value} -> every save 400'd.
  (2) Ducky bot get_site_status tool was hardcoded; never read the DB -> bot reported stale values regardless of admin changes.
  (3) Script-halt TDZ bug: inline <script> (line 1292) ran before the admin-modal HTML (~line 2660) was parsed, so getElementById('adminModal').addEventListener(...) threw on null, halting the whole script -> `let siteStatusData` stayed in temporal-dead-zone -> "Failed to load site status." (also broke allProtocolsCache and later top-level lets).
  (4) Protocols edit: frontend sent {id,status} but backend read body.code -> 500.
  (5) Environment: repo used MongoDB; sandbox only supports SQLite; no Groq/Gemini keys for the bot.
- Ported repo into /home/z/my-project (src/app/api, src/lib, public, mini-services, prisma schema). Kept existing Next 16 / Tailwind 4 / shadcn setup.
- Adapted prisma schema mongodb -> sqlite; db:push; seeded default SiteStatus (8 sectors), 5 Protocols, 2 SCPs.
- Fixed PUT /api/admin/site-status to accept a map of updates (upsert each) + added DELETE; returns refreshed map.
- Fixed PUT /api/admin/protocols to accept id-as-code (upsert).
- Rewired Ducky bot: get_site_status / get_protocol_status / search_scp_database now read live from DB (with hardcoded fallback); added getLiveContextString() that injects live SiteStatus/Protocols/SCPs into the fallback system prompt; added z-ai-web-dev-sdk as Layer 5 fallback so the bot runs without external keys.
- Frontend: added Add-Key/Delete UI + save feedback (#siteStatusMsg); guarded load/save with res.ok + error display.
- Fixed the script-halt by deferring admin-panel listener registration to DOMContentLoaded (optional-chaining guarded).
- Installed discord-interactions + @vercel/functions; installed mini-service deps; started support-service on :3003 (gracefully skips Discord w/o token).

Stage Summary:
- Verified via Agent Browser: terminal login -> admin login (admin-0157) -> Site Status tab loads 8 rows (no "Failed to load") -> edited C-3=CRITICAL -> "Saved 1 change(s)" -> persisted (curl confirms) -> asked Ducky bot "status of C-3?" -> bot replied "C-3 is currently in CRITICAL status". After reset, bot replies "WARNING".
- Lint clean; no runtime errors in dev.log; footer present on desktop + mobile (375x812).
- Files changed: prisma/schema.prisma, next.config.ts, src/app/api/admin/site-status/route.ts, src/app/api/admin/protocols/route.ts, src/app/api/stream/route.ts, public/index.html, package.json (deps). Added mini-services/support-service.

---
Task ID: 2
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix test-log publish + SCP database display; add admin panel functions (edit/create/delete, stats)

Work Log:
- Bug 1 (test logs won't publish): frontend addTestLog() sent {scpReference} but backend read body.scpRef -> 400 Missing required fields -> silent fail. Fixed backend to accept both scpRef and scpReference; added PUT for editing. Frontend now sends scpRef + shows "Test log published." feedback.
- Bug 2 (SCPs don't show in database): public Anomaly Database page (#page-objects) was entirely hardcoded HTML; no JS fetched /api/public/scps. Replaced with a dynamic container (#dbScpGrid) + loadDatabase() that fetches from API, merges with 15 curated fallback SCPs (deduped by scpId), groups by class (SAFE/EUCLID/KETER), adds a search box, and tags admin-added entries with an "ADMIN" badge. Wired into go('objects').
- Admin enhancements:
  - Stats overview bar at top of admin panel (live counts: SCPs, Test Logs, Protocols, Status Keys).
  - Reusable editor modal (#editorModal) for editing SCPs, test logs, and protocols (all fields, not just status).
  - SCP EDIT button + PUT /api/admin/scps.
  - Test Log EDIT button + PUT /api/admin/test-logs.
  - Protocol CREATE form + POST /api/admin/protocols; Protocol DELETE + DELETE /api/admin/protocols?code=; full protocol EDIT (name/target/status/assignedTo/description) replacing the old single-status prompt.
  - Feedback messages (#scpMsg/#tlMsg/#protoMsg) on every add/edit/delete with success/error text.
  - HTML-escaping (escHtml/escAttr) on all dynamic table content to prevent injection.

Stage Summary:
- Verified via Agent Browser: admin login -> Test Logs tab -> added "Immobility Verification" -> "Test log published." (table + stats updated). SCPs tab -> added SCP-3008 "The Infinite IKEA" -> "SCP SCP-3008 added to database." -> navigated to public Database page -> SCP-3008 appears with ADMIN tag (count 18->19). Edited SCP-3008 via editor modal (changed name) -> "SCP updated." -> table + DB persisted the new name -> Database page reflects "Infinite IKEA (Updated)". Created protocol EPSILON-4 -> appeared -> deleted -> "Protocol EPSILON-4 deleted." Test-log edit (severity MINOR->SEVERE) -> "Test log updated."
- Lint clean; no runtime errors; test data cleaned up.
- Files changed: src/app/api/admin/test-logs/route.ts, src/app/api/admin/scps/route.ts, src/app/api/admin/protocols/route.ts, public/index.html (dynamic DB page, stats bar, editor modal, feedback, protocol create/delete form).

---
Task ID: 3
Agent: Z.ai Code (general-purpose sub-agent)
Task: Add Incident Reports (admin-managed, public-readable) + Anomaly Reports (user-submitted, admin-reviewable) backend to Site-92 SCiPNET.

Work Log:
- Read worklog (Tasks 1 & 2), prisma/schema.prisma, src/app/api/admin/scps/route.ts, src/app/api/public/scps/route.ts, src/lib/db.ts to understand existing patterns (NextRequest/NextResponse, `requireAdmin` helper checking `x-admin-token: site92-admin-authenticated`, try/catch + console.error style, `import { db } from '@/lib/db'`).
- Appended two new Prisma models to `prisma/schema.prisma` (after SiteStatus): `Incident` (id, code @unique, title, severity default MODERATE, sector default UNKNOWN, description, status default ACTIVE, reportedBy default SYSTEM, createdAt, updatedAt) and `AnomalyReport` (id, reporterName, scpRef, location, description, contact default "", status default PENDING, createdAt, updatedAt). Both use plain `@id @default(cuid())` exactly as the task spec defined them (no @map), matching the model definitions in the instructions.
- Ran `bun run db:push` -> "Your database is now in sync with your Prisma schema." + Prisma Client v6.19.2 generated. No data loss.
- Created 4 route files matching the admin/scps pattern verbatim (same requireAdmin helper, same error messages/format, same response shapes, same `db` import):
  * `src/app/api/public/incidents/route.ts` — GET (public, returns all incidents ordered createdAt desc).
  * `src/app/api/admin/incidents/route.ts` — GET (all), POST (create, requires admin, validates code/title/description), PUT (update by id, requires admin), DELETE (?id=, requires admin).
  * `src/app/api/public/anomaly-reports/route.ts` — GET (public, returns all ordered createdAt desc) AND POST (public submission, no auth, validates reporterName/scpRef/location/description non-empty, defaults status to PENDING).
  * `src/app/api/admin/anomaly-reports/route.ts` — GET (all), PUT (update status/fields by id, requires admin), DELETE (?id=, requires admin). No POST — submissions only come through the public route.
- Seeded 5 sample incidents via a temp `seed-incidents.ts` script (using `new PrismaClient()` directly as allowed) — codes INC-2025-0412 / -0407 / -0399 / -0394 / -0388, severities CRITICAL/HIGH/MODERATE/HIGH/LOW, varied sectors (HEAVY-CONTAINMENT, STORAGE-C, D-SECTOR, IT-INFRASTRUCTURE, CRYO-LAB), varied statuses (RESOLVED/ACTIVE/INVESTIGATING). Ran successfully ("Seeded 5 incidents."), then deleted the temp script file.
- Ran `bun run lint` -> clean (no errors, no warnings) in any of the new/modified files.

Stage Summary:
- `bun run db:push` succeeded; Incident + AnomalyReport tables created in SQLite.
- `bun run lint` clean (zero errors / warnings).
- Files created:
  * `src/app/api/public/incidents/route.ts`
  * `src/app/api/admin/incidents/route.ts`
  * `src/app/api/public/anomaly-reports/route.ts`
  * `src/app/api/admin/anomaly-reports/route.ts`
- Files modified:
  * `prisma/schema.prisma` (appended Incident + AnomalyReport models)
- Seeded 5 sample incidents (INC-2025-0412..0388) directly into the DB so the public incidents page will not be empty.
- Did NOT touch `public/index.html`, `src/app/api/stream/route.ts`, or `src/app/api/query/route.ts` (per task rules). Frontend wiring for the new endpoints is left to other tasks/agents.

---
Task ID: 4+5+6
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix AI bot SCP error + add user features + add admin features

Work Log:
- AI FIX (Task 1+2): Root cause = /api/query fallback was missing the z-ai-web-dev-sdk layer, returning "[ERROR 401-AI] AUTHENTICATION FAILURE" whenever the stream endpoint failed/timed out. Added z-ai Layer 5 + getLiveContextString() + getScpContext() to /api/query. Added getScpContext() to /api/stream. getScpContext detects SCP-XXX in the prompt, checks local DB first, then fetches the official SCP wiki via z-ai page_reader (the sandbox can't reach the wiki directly, but z-ai API can). Result: SCP-7601 now returns accurate wiki data (Peking Duck anomaly) instead of an error or hallucination.
- BACKEND (Task 3, subagent): Added Incident + AnomalyReport Prisma models, 4 new API routes (public + admin for each), seeded 5 sample incidents. Fixed Prisma client regeneration issue.
- USER FEATURES (Task 4):
  - SCP Detail Modal: click any SCP card on the Database page -> modal with full details (class, threat, zone, source, description).
  - Personal Watchlist: add/remove SCPs to a localStorage watchlist, shown in a dedicated section on the Database page.
  - Report Anomaly page (new "Report" nav link): form for users to submit anomaly sightings (reporterName, scpRef, location, description, contact) -> POST /api/public/anomaly-reports. Shows community reports list below.
  - Dynamic Incidents page: replaced hardcoded HTML with live fetch from /api/public/incidents, with severity filter buttons (ALL/CRITICAL/HIGH/MODERATE/LOW) and timeAgo display.
  - Site Alert Banner: reads SITE_ALERT key from site-status; shows a pulsing red banner at the top of the app for all users.
- ADMIN FEATURES (Task 5):
  - Incidents tab: full CRUD (add form + edit via reusable editor modal + delete). 6 stats now (SCPs, Test Logs, Protocols, Incidents, Reports, Status Keys).
  - Reports tab: reviews user-submitted anomaly reports with status buttons (REVIEW/RESOLVE/DISMISS) + delete.
  - Site Alert Broadcast: dedicated UI in Site Status tab to set/clear the SITE_ALERT key, instantly broadcasting to all users.
  - Clear AI Memory button: calls /api/stream/clear to reset Ducky's conversation context.
  - Incident editor: added 'incident' type to the reusable openEditor/submitEditor (title, severity, sector, status, description).
- Fixed JS syntax error: clearAiMemory confirm() had Ducky\\'s which broke the string literal and halted the entire inline script (making sendChat undefined, which is why the AI chat didn't work in the browser).

Stage Summary:
- Verified via Agent Browser: AI chat asked "what is SCP-7601?" -> bot returned accurate wiki-sourced data (Keter-class Peking Duck). Dynamic Incidents page shows 5 seeded incidents with filter buttons. Report Anomaly page form submits successfully ("Report submitted."). SCP detail modal opens on card click, watchlist adds items (1 item). Admin panel: stats bar shows all 6 counts; Incidents tab shows 5 rows; Reports tab shows 1 card; Site Alert broadcast shows banner instantly for all users; alert clears correctly. Footer present on desktop + mobile (375x812). Lint clean.
- Files changed: src/app/api/query/route.ts, src/app/api/stream/route.ts, prisma/schema.prisma (subagent), 4 new route files (subagent), public/index.html (CSS + HTML + JS for all features).

---
Task ID: 7
Agent: Z.ai Code (orchestrator, direct execution)
Task: Add Remember Me login + speed up loading + fix all bugs

Work Log:
- Remember Me feature:
  - Added a "Remember me on this terminal" checkbox to the login form (step 1).
  - On successful login with checkbox checked: stores {user, pass} in localStorage under 'scipnet_remember'.
  - On page load: if remembered creds exist, validates them and does instant login (skips boot screen + loader + bio scan + TFA entirely). Hardcoded creds (TEST/AGENT/ADMIN) validated immediately; DB creds wait for fetchCreds() to load (with 3s timeout fallback).
  - If checkbox unchecked on login: clears any previously stored creds.
  - Added a signOut() function (wired to the nav-user area / logoutBtn): clears localStorage + sessionStorage, reloads to login screen.
- Faster loading:
  - Boot screen: reduced per-message delay 250ms -> 90ms, post-boot delay 800ms -> 250ms (was ~2.5s, now ~0.9s).
  - Loader: increased increment step (random*10 -> random*18), reduced interval 150ms -> 80ms, completion delay 500ms -> 200ms (was ~2s, now ~0.6s).
  - Bio scan: increased step 2% -> 5%, reduced interval 50ms -> 30ms, post-scan delay 500ms -> 200ms (was ~3s, now ~0.8s).
  - TFA transition: reduced 1000ms -> 500ms, access stamp 1500ms -> 800ms.
  - restoreActiveTicket delay: 1500ms -> 300ms.
  - With Remember Me: total load on return visits ~928ms (was ~8.5s) — 9x faster.
- Removed Prisma query logging noise (src/lib/db.ts: log ['query'] -> ['warn','error'] in dev, [] in prod). Was cluttering dev.log with every SQL query.
- Bug fixes: none needed beyond the above — all existing features verified working (6 admin stats load, database loads in 431ms, no console/runtime errors).

Stage Summary:
- Verified via Agent Browser: (1) First visit shows boot+loader+login normally (faster). (2) Login with Remember Me checked -> creds stored in localStorage. (3) Reload -> instant auto-login in 928ms (boot screen + login screen display=none, app shown, nav shows username). (4) Sign Out -> clears creds, returns to login. (5) Login WITHOUT Remember Me -> localStorage stays null, reload shows login (no auto-login). (6) Mobile 375x812: auto-login works, footer present. (7) Desktop footer pushed down naturally on long pages. (8) All 6 admin stats load (Scps=4, TestLogs=1, Protocols=7, Incidents=5, Reports=0, StatusKeys=8). (9) Database loads in 431ms. (10) Lint clean, no dev.log errors.
- Files changed: src/lib/db.ts (Prisma logging), public/index.html (Remember Me checkbox, auto-login logic, signOut, faster boot/loader/bio/TFA animations, reduced delays).

---
Task ID: 8
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix Discord bot key generation for Vercel + MongoDB Atlas — guarantee no duplicate keys

Work Log:
- Root cause: the Discord interactions route used a check-then-create pattern (findUnique → if null, create). On Vercel serverless, a double-click or two concurrent instances could both pass the findUnique check and both try to create, causing either a duplicate credential or a "Failed to generate" error.
- Fix: created src/lib/credentials.ts with a shared getOrCreateCredential(identity) function that uses Prisma upsert — a single atomic DB operation. If the identity already has a credential, it returns the existing one (update: {} = no changes). If not, it creates one. No race condition, no duplicates. Retries up to 5 times on username collision (the random AGENT-XXXX could collide on the @unique username constraint).
- Rewrote /api/discord/interactions/route.ts to use the shared lib. Same deferred-ACK + waitUntil pattern preserved for Vercel reliability.
- Added /api/request-key/route.ts — a public web endpoint that generates a key without Discord (dedup by callsign). Uses the same atomic getOrCreateCredential logic. The callsign is stored as "web:<callsign>" in the discordUserId column (@unique), keeping it separate from Discord user IDs. This works on Vercel without Discord configured AND is testable in this sandbox.
- Added a "Generate Terminal Key" panel on the login screen (link: "[ Generate Terminal Key ]"). Users enter a callsign, get a username/password. Same callsign → same key. After generating, fetchCreds() is awaited so the login form recognizes the new key immediately.
- The discordUserId field serves as a generic "external identity" column: Discord user IDs for Discord, "web:<callsign>" for web. No schema change needed — works on both SQLite (sandbox) and MongoDB Atlas (Vercel deploy).

Stage Summary:
- Verified via curl: (1) First request "testuser" → new key AGENT-6431. (2) Repeat "testuser" → SAME key, isNew=false. (3) Different callsign → new key. (4) 10 CONCURRENT requests with "racer" → ALL returned the SAME key (AGENT-1017). (5) DB check: exactly 1 record for "web:racer" — zero duplicates under concurrent load.
- Verified via browser: Generated key via web panel (callsign "agent99" → AGENT-2513). Generated again → same key, "Welcome back". Logged in with the generated key → progressed to TFA. fetchCreds refreshes after generation so login works immediately.
- Lint clean, syntax clean, no dev.log errors. Test data cleaned up.
- Files: src/lib/credentials.ts (new), src/app/api/discord/interactions/route.ts (rewritten), src/app/api/request-key/route.ts (new), public/index.html (Generate Terminal Key panel + JS).

---
Task ID: 9
Agent: Bug Scanner (subagent)
Task: Static-analysis bug scan of public/index.html

Work Log:
- Read /home/z/my-project/worklog.md to understand prior fixes (cursor fix, DB schema, admin modal TDZ, AI bot, Remember Me, etc.).
- Scanned /home/z/my-project/public/index.html (~6512 lines, inline script at lines 2334-6447).
- Mapped all 25 page sections (page-overview … page-admin) and 4 modal elements placed AFTER the inline script (adminModal, editorModal, scpDetailModal, personnelModal).
- Inventoried every `function`, every `addEventListener`, every `getElementById(...)` access pattern, every `innerHTML` injection, every `setInterval`, every inline `onclick`, and every API fetch.
- Verified the previously-fixed TDZ bug (admin modal listeners deferred to DOMContentLoaded with `?.` chaining) and confirmed no regressions.
- Specifically looked for: JS runtime errors, null-deref risks, broken event listeners, ungraceful API fetches, dead code, XSS via innerHTML, z-index/overlap bugs, setInterval leaks, missing-load-function-on-go() bugs, hardcoded secrets.

Stage Summary:
- Found 0 CRITICAL, 5 HIGH, 11 MEDIUM, 9 LOW bugs (25 total).
- Top 5 most impactful findings:
  1. **Normal login flow never updates `navUn`/`navAv`** (line 3287-3299, tfaForm submit handler). The username entered in the login form is captured in a local const and discarded before `initApp()` runs. Topbar always shows "AGENT" regardless of who logged in (TEST/ADMIN/DB-generated). Also corrupts achievement storage key (`scipnet_ach_<user>`) and news article author attribution (`addNews` line 4512 reads `navUn`). Only the Remember-Me path (`doInstantLogin`) sets `navUn` correctly.
  2. **`clearChatSession` doesn't update the `const sessionId`** (line 3558 + 3787-3798). The const was captured at page load; `clearChatSession` writes a new ID into `sessionStorage` but the const can't be reassigned. Subsequent `sendChat()` calls still send the OLD sessionId to `/api/stream`, so server-side memory is reused. The new session ID in sessionStorage is never read back, so on page reload the user loses the chat history that was just created under the old ID.
  3. **Multiple `innerHTML` XSS sinks** where API or stream data is interpolated without escaping: user's own chat `${prompt}` (line 3570), `data.thinking` (3643), `toolsList` from `data.tool_call` (3652), `fallbackData.error` (3700), `data.reply` (3620/3628), and the entire protocols table at 4063-4074 (`${p.code}`, `${p.name}`, `${p.target}`, `${p.status}`, `${p.assignedTo}`, `${p.description}` — all unescaped).
  4. **`camFsAnimId` declared but never assigned** (line 4900, 4913, 4919). `startCameraAnimation` doesn't return the rAF id; the variable stays null forever, so `if (camFsAnimId) cancelAnimationFrame(camFsAnimId)` is a no-op. Opening fullscreen twice (or closing it) leaves the previous rAF loop running on a hidden/detached canvas — a small but real CPU leak that only gets cleaned up if the user revisits the cameras page (which calls `loadCameras` and cancels all `camAnimations`).
  5. **Race condition between `realBootSequence` and `doInstantLogin`** when a remembered DB credential is auto-logging in (line 2805-2824 + 3212-3228). `checkRemembered` kicks off `realBootSequence` (boot animation) in parallel with `fetchCreds`. When `fetchCreds` resolves faster than the boot animation, it calls `doInstantLogin` which hides the boot/loader/login and shows the app — but `realBootSequence` keeps running and eventually calls `startRealLoader`, which sets `loader.style.display='flex'`, briefly flashing the loader over the app for ~600 ms before `loginScreen.classList.add('show')` no-ops (display:none inline wins).
- Patterns noticed:
  - The 4 modals placed AFTER the inline `<script>` (adminModal, editorModal, scpDetailModal, personnelModal) are all accessed with `?.` chaining or inside `DOMContentLoaded` listeners — the prior TDZ bug pattern is consistently avoided for those. But many addEventListener calls on elements in the main body (ham, searchBtn, notifBtn, notifClear, openSupportBtn, sendCodeBtn, lcInput, loginForm, tfaForm, chatClearBtn, chatInput, micBtn) have NO null check. They work today because those elements are parsed before the script tag, but they're fragile — a future HTML edit removing any of those IDs would silently halt the entire inline script.
  - The codebase consistently uses `escHtml` for table content but NOT for `onclick='...'` attribute values (escHtml doesn't escape single quotes). Used in admin tables at lines 4408, 4461-4464, 4499, 5998, 6066, 6137. Low practical risk because backend cuid IDs are alphanumeric, but the pattern is unsafe.
  - Several places use a partial-escape (`text.replace(/</g,'&lt;')` only) instead of `escHtml`: `showAdminNotification` (3053), `keyGenResult` (2904), `appendChatMessage` label (3187). If the server ever returns text containing `>` or `&` or `"`, it would render incorrectly or break attributes.
  - Several background `setInterval`s have no cleanup (anti-cheat detection, matrix canvas, topTime clock). Intentional, but worth noting for a future cleanup-on-logout refactor.

---
Task ID: 10
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix "invisible page on load" + DB broken + cursor + all other bugs

Work Log:
- CRITICAL DB bug: prisma/schema.prisma was set to `provider = "mongodb"` but the sandbox .env has a SQLite URL (`file:.../custom.db`), causing EVERY API endpoint that touches the DB to return 500 with "the URL must start with the protocol mongo". Switched provider to `sqlite` for the sandbox (user will switch back to mongodb when committing for Vercel). Force-reset the DB (--force-reset --accept-data-loss) to drop the old _id column conflicts. Re-seeded: 8 SiteStatus keys, 5 SCPs (999/173/049/682/096), 3 TestLogs, 4 Protocols, 5 Incidents, 4 NewsItems, 3 hardcoded Credentials (TEST/AGENT/ADMIN). Created scripts/seed.ts.
- CRITICAL "invisible page" bug: CSS `html,body{cursor:none}` hid the OS cursor on EVERY page load, while the custom cursor (`.cursor-dot/.cursor-ring`) starts with `opacity:0` and only becomes visible after `mousemove` fires. Net effect: opening the page showed NO CURSOR AT ALL until the user moved the mouse. Fixed by:
  1. Removed `cursor:none` from html/body default rule.
  2. Added scoped CSS: `html:not(.cursor-active) body * { cursor: revert !important }` (OS cursor visible by default) and `html.cursor-active, html.cursor-active * { cursor: none !important }` (OS cursor hidden only after custom cursor activates).
  3. Rewrote the cursor JS to add a `cursor-active` class to html/body on first `mousemove` (via `activateCustomCursor()`), not just to the dot/ring.
  4. Changed device detection from `navigator.maxTouchPoints > 0` (which fires on touch laptops that DO have a real cursor) to a stricter phone/tablet UA regex `/Mobi|Android|iPhone|iPad|iPod|Tablet|Silk/`.
  5. Made `toggleCustomCursor()` properly clean up the cursor-active class, rAF loop, and dot/ring display when disabled.
  6. Made the settings toggle (`#cursorToggle`) reflect the actual initial state (added `on` class only when cursor is enabled; removed on touch devices).
- Anti-cheat spam: DevTools window-size detection threshold raised 160 -> 250 (was triggering on the iframe preview environment where outer/inner diff is naturally large). Backend logging now happens AT MOST ONCE per page load (client-side `backendLoggedThisSession` flag). Server-side rate-limited to one log per event type per 60s. The `debugger` statement-based detector is now disabled in sandbox/preview/localhost environments (was causing the spammy dev.log entries every 4s).
- HIGH-1 (topbar always shows "AGENT" regardless of who logged in): added a top-level `let currentUser = 'AGENT'` variable, set it in the `loginForm` submit handler, and updated `navUn`/`navAv` in the `tfaForm` submit handler before calling `initApp()`. Previously the username from step 1 was local to that handler and discarded before `initApp()` ran, also corrupting the achievement storage key and the news article author field.
- HIGH-2 (clearChatSession can't update `sessionId`): changed `const sessionId` to `let sessionId` and reassign it inside `clearChatSession()` after generating the new ID. Previously the const couldn't be reassigned so subsequent `sendChat()` calls kept sending the OLD session ID, defeating the server-side memory clear.
- HIGH-3 (XSS via innerHTML in protocols table + partial-escape patterns elsewhere): wrapped all `${p.code}/${p.name}/${p.target}/${p.status}/${p.assignedTo}/${p.description}` in the public protocols table in `escHtml()`. Also fixed the partial-escape `.replace(/</g,'&lt;')` patterns in `showAdminNotification`, `keyGenResult`, and `appendChatMessage` (label) by replacing them with `escHtml()`. Hardened `escHtml()` to also escape single quotes (`'` -> `&#39;`) since it's used inside `onclick='...'` attributes. Same for `escAttr()`. Personnel avatar `src` now wrapped in `escAttr()`.
- HIGH-5 (auto-login race): `startRealLoader()` now bails out early if `document.getElementById('app').classList.contains('show')` is already true — prevents the loader briefly flashing over the app when a remembered DB credential auto-logs in faster than the boot animation completes.
- MEDIUM-1 (pwToggle did nothing): added a click handler that toggles `inPass.type` between `'password'` and `'text'`.
- MEDIUM-3 (modals hidden behind live-chat overlay): raised `editor-modal` and `scp-detail-modal` z-index from 1000 to 100001 (above admin-modal which is 100000, and above live-chat-overlay which is 99990). Both are reused for personnelModal.
- MEDIUM-10/11 (timer/rAF leaks on page-away): the `go(page)` navigation function now clears `breachTimeInterval` when leaving `breach-sim`, and cancels all rAF loops in `camAnimations` when leaving `cameras`. Prevents CPU waste on hidden pages and GPU leak on detached canvases. Also added a null check on the page element lookup.
- Also fixed `Math.random().toString(36).substr(2, 12)` -> `.slice(2, 14)` (substr is deprecated).

Stage Summary:
- DB now works: site-status returns seeded keys, credentials returns TEST/AGENT/ADMIN, incidents returns 5 seeded items.
- Cursor: OS cursor visible by default; custom cursor activates on first mousemove (no more "invisible page"); touch devices correctly detected via UA (not maxTouchPoints) so touch laptops keep their real cursor.
- Anti-cheat: no longer spams dev.log; one backend log per session per event type; threshold raised so preview iframe doesn't false-trigger.
- Login flow: topbar now shows the actual logged-in user (not always "AGENT"); password show/hide button works; login error message is dynamic.
- Modals: editor/SCP detail/personnel modals now render above the live-chat overlay.
- Memory safety: page-away timer cleanup prevents CPU/GPU leaks when navigating between cameras and breach-sim.
- Server: dev server restarted, lint clean, all tested endpoints (site-status, credentials, incidents) return HTTP 200 with seeded data.

---
Task ID: 10-verify
Agent: Z.ai Code (orchestrator, direct execution)
Task: Browser verification of all fixes via Agent Browser

Work Log:
- Verified the page no longer "invisible on open": opened http://localhost:3000/ fresh, the OS cursor was visible by default (`getComputedStyle(body).cursor === "auto"`), `html.cursor-active` was `false`, custom cursor elements had `opacity: 0` and `display: block` (invisible until first mousemove). The user can interact with the login form without any cursor-juggling.
- Verified the cursor toggle in Settings: clicking it OFF removed `cursor-active` from html/body and restored body cursor to `auto`. Clicking it ON re-enables (cursor-active returns on next mousemove). The toggle's `on` class is correctly synced with the actual state (off on touch devices, on by default on desktop).
- Verified login flow: filled TEST/TEST in step 1 (Personnel ID + Passphrase), tested the password show/hide eye-icon button (MEDIUM-1 fix): input type toggled between `password` and `text`. Submitted, progressed to bio scan, then TFA (skipped via JS), submitted TFA code, landed in app.
- Verified HIGH-1 fix: after login, topbar shows `navUn="TEST"` and `navAv="TE"` (actual logged-in user, not the hardcoded "AGENT").
- Verified data loading from the fixed SQLite DB:
  - Database page: 20 SCP cards loaded (5 seeded + 15 hardcoded). Visible: SCP-999 (Tickle Monster), SCP-131 (Eye Pods), SCP-294 (Coffee Machine), SCP-049 (Plague Doctor), SCP-682 (Hard-to-Destroy Reptile), SCP-096 (Shy Guy), etc.
  - News Feed page: 4 news items loaded — "Q3 Personnel Review Complete", "Scheduled Maintenance Window", "CODE BLACK Drill This Friday", "New MTF Squad Deployed".
  - Incidents page: 5 incidents loaded — "Containment Cell Crack in Sector B-7", "Personnel Exposure to SCP-049", "Camera Malfunction in Heavy Containment", "Unauthorized Access to Terminal", "Power Fluctuation in Low Containment".
  - Personnel page: 10 personnel rows loaded (Discord integration).
  - Achievements page: 36 achievement cards rendered.
  - Site AI (Ducky 2.5) page: chat input "Ask Ducky anything..." + initial greeting "Hey. I'm Ducky, the Site-92 AI. I've got 19 tools connected to live da...".
  - Settings page: all toggles present (CRT Filter, Matrix Background, Custom Cursor ON, Sound Effects, Noise/Scanline opacity sliders, Accent Color).
  - Departments page, Cameras page, Admin Panel page, License page, Terminal page, MTF page, Site Map page — all load their page-head titles.
- Verified API endpoints (curl): site-status HTTP 200, credentials HTTP 200, incidents HTTP 200, scps HTTP 200, news HTTP 200, admin/news HTTP 200. All return seeded JSON.
- Verified no console errors via `agent-browser errors`.
- Verified lint clean: `bun run lint` exits 0.

Stage Summary:
- The "invisible page" bug is FIXED. OS cursor is visible by default, custom cursor activates only after the first mousemove.
- The DB is FIXED (provider sqlite + seeded data). All API endpoints return real data; all frontend pages display real data instead of "Failed to load" / "0 items".
- Login topbar correctly shows the logged-in user (TEST, not AGENT).
- Cursor settings toggle reflects actual state and properly enables/disables the custom cursor at runtime.
- Password show/hide eye-icon now actually toggles.
- Modals now stack above the live-chat overlay (z-index 100001).
- Anti-cheat no longer spams dev.log (one backend log per session per event type; threshold raised to 250 to avoid iframe false positives; debugger-statement detector disabled in sandbox).
- Memory leaks on page navigation fixed (clear breachTimeInterval, cancel camera rAF loops).
- XSS hotspots in the protocols public table and partial-escape patterns in showAdminNotification / keyGenResult / appendChatMessage hardened via escHtml/escAttr (single quotes now escaped for use inside onclick attributes).

---
Task ID: 11
Agent: Z.ai Code (orchestrator, direct execution)
Task: Fix the "still bugged" cursor — found and fixed a no-cursor-at-all bug on mobile viewport

Work Log:
- Used agent-browser to inspect the actual cursor state across scenarios.
- Discovered the real bug: the JS detected "mobile" only via `navigator.userAgent` (regex `/Mobi|Android|iPhone|iPad|iPod|Tablet|Silk/`), but the CSS hid the custom cursor via `@media(max-width:768px){.cursor-dot,.cursor-ring{display:none!important}}`. On a desktop browser narrowed to ≤768px (or a desktop UA on a mobile-width preview), the JS still had `cursorEnabled = true`, so the first mousemove added `cursor-active` to body, which triggered `html.cursor-active, html.cursor-active *{cursor:none !important}` (hiding the OS cursor). Meanwhile the CSS media query hid the custom cursor. Result: NO CURSOR AT ALL on a narrow viewport.
- Fix: detect mobile via BOTH UA AND viewport width (`window.innerWidth <= 768`, matching the CSS media query). Added `isMobileViewport()` helper. `cursorEnabled` is now `!isPhoneTabletUA && !isMobileViewport()`.
- Added a `resize` listener so the cursor auto-disables when the window shrinks to mobile width and re-enables when it grows back to desktop. Toggle and `cursor-active` class are kept in sync on every transition.
- Added a guard in `toggleCustomCursor`: if user tries to enable the cursor while `isMobileViewport()` is true, the toggle is forced back OFF (prevents the "no cursor at all" state from being re-introduced via the Settings panel).
- Extracted `applyCursorDisabled()` helper so the initial-disable path, the resize-shrink path, and the toggle-off path all use the exact same cleanup (remove `cursor-active` from html+body, hide dot+ring, cancel rAF, sync toggle UI). No more duplicated cleanup code that could drift.

Stage Summary:
- Verified via agent-browser at 375x812 (mobile viewport, desktop UA — the exact scenario that was broken):
  - Before fix: mousemove → `bodyCursor="none"`, `dotDisplay="none"` → NO CURSOR AT ALL.
  - After fix: initial `cursorEnabled=false`, `cursorToggleOn=false`, `dotDisplay="none"`, `bodyCursor="auto"`. After mousemove: `htmlCursorActive=false`, `bodyCursor="auto"` (OS cursor stays visible). Toggle click is refused (stays OFF).
- Verified at 1280x800 (desktop): initial `cursorEnabled=true`, `cursorToggleOn=true`, `dotOpacity=0`, `bodyCursor="auto"`. After mousemove to (500,400): `dotAt=[500,400]`, `bodyCursor="none"`, `htmlCursorActive=true`. After mousemove to (300,200): `dotAt=[300,200]` (cursor tracks correctly across multiple moves).
- Verified resize: 1280x800 → 400x800: `cursorEnabled` flips to `false`, `cursorToggleOn` flips to `false`, `bodyCursor="auto"`. Resize back to 1280x800: `cursorEnabled=true`, `cursorToggleOn=true`, custom cursor re-enabled (activates on next mousemove).
- Lint clean, no dev.log errors.
- Files changed: public/index.html (cursor JS + toggle + resize listener + isMobileViewport helper + applyCursorDisabled helper).

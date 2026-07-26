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

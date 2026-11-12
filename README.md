# Devaansh Makhijani — AI/ML Engineer

A Matrix-styled portfolio where the code builds the page. A "Wake up, Neo" cold open (once per session,
skippable with any key) breaks apart into the rain; glyphs peel out of a full-screen rain, trace the
 The rain keeps running
behind every section, reacting to scroll depth.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
npm run typecheck && npm run lint && npm test
npm run sync:repos   # refresh public/data/repos.json (the offline fallback snapshot)
```

## Customise

| File | What it controls |
| --- | --- |
| `src/config/site.ts` | Name, e-mail, LinkedIn, GitHub account |
| `src/config/content.ts` | Hero copy, profile terminal, the two featured systems, per-repo blurbs for the GitHub list, experience, certifications, skills |
| `src/components/projects/diagrams.ts` | The architecture diagrams (nodes, groups and edges as plain data) |
| `.env` → `VITE_GITHUB_USERNAME` | GitHub account used for links and live data (default `maks-labs`) |

New public repositories appear in the GitHub Projects section automatically; add an entry to `repoNotes`
to give one a custom description.

## GitHub synchronisation

1. **Runtime, in the browser:** `src/lib/github.ts` calls `GET /users/{user}/repos` (public, no token), follows pagination
   (100 per page), and caches the result in `localStorage` for 15 minutes (stale-while-revalidate).
2. **Rate limits / offline:** on failure the UI keeps the last good cache; with no cache it falls back to the static
   snapshot `public/data/repos.json`, and says so ("CACHED" / "SNAPSHOT" badge plus a visible notice).
3. **Scheduled snapshot:** `.github/workflows/sync-repos.yml` regenerates the snapshot every 6 hours and commits it.
   Any host that rebuilds on push (Vercel, Netlify, Cloudflare Pages, GitHub Pages) republishes it automatically.
   Set a repository variable `GITHUB_USERNAME` if you change accounts.

No token is ever read by or shipped to the browser. Only public data is requested.

## Architecture

- `src/lib/matrix.ts` — page-wide rain: sprite-atlas glyphs in three depth tiers, scroll parallax per tier,
  brightness tied to scroll, half frame rate behind content, paused when the tab is hidden.
- `src/lib/typo.ts` — the hero reveal: the background rain pours through the hero, and wherever a real
  rain column passes over the name or the intro copy, it lights up (`RainText` spans switch on as a head
  crosses them). When everything is lit, the code texture dissolves into the solid lettering.
- `src/lib/fx.ts` + `components/fx/Fx.tsx` — cursor glyph trail, magnetic buttons and the section rail.
- `src/lib/scrollLoop.ts` — one rAF-batched scroll loop shared by every scroll-driven effect.
- Scroll-driven: architecture diagrams assemble node by node (one CSS variable), GitHub projects travel
  horizontally on desktop (sticky, native scroll), the experience timeline charges up and lights each role.
- `components/intro/WakeUp.tsx` — the cold open; the hero construction waits for it via `rainStore.introDone`.
- Reduced motion: no cold open; everything renders in its final state; no trails, packets, travel or decode effects.

## Limitations

- The contact terminal opens a pre-filled draft in the visitor's mail client (`mailto:`); there is no server.

# Drama Relationship Map

**Live app:** [charactermap.vercel.app](https://charactermap.vercel.app/)

AI-assisted, visual relationship boards for dramas, reality shows, and other casts-heavy stories. The homepage is a cinematic marketing experience; the **demo** is a full-width interactive “string board” you can pan, drag, export as PNG, and open in fullscreen.

## What you get today

- **Landing** — Hero, featured universes (with TMDB imagery), editorial sections, and a CTA into the live board.
- **`/demo`** — Two flows:
  - **Single’s Inferno S5** — Curated showcase with episode-aware ties and timeline UX.
  - **Custom show** — Describe any title; the app asks an LLM for a structured cast + edges, then renders the same board.
- **Relationship board** — Draggable character cards, labeled edges (romance / conflict / alliance / crush, etc.), optional cast headshots (TMDB + optional image fallback), fullscreen and PNG export.

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**, **Tailwind CSS** 4  
- **Server routes** — `POST /api/agent-graph` (OpenAI- or DeepSeek-compatible chat completions), `GET /api/cast-headshots`, TMDB helpers for packaged seasons  
- **Client** — `html-to-image` for export; no database required for the shipped demo (state is in-memory / session).

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (or `.env.local` locally). Never commit secrets.

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` | Default OpenAI chat if no custom URL / provider override. |
| `DEEPSEEK_API_KEY` | DeepSeek chat when `LLM_PROVIDER=deepseek` or as fallback wiring. |
| `LLM_PROVIDER` | Optional: `deepseek` to prefer DeepSeek when both keys exist. |
| `LLM_CHAT_COMPLETIONS_URL` + `LLM_API_KEY` | Optional OpenAI-compatible endpoint + key. |
| `LLM_MODEL` / `OPENAI_MODEL` / `DEEPSEEK_MODEL` | Model id overrides. |
| `TMDB_API_KEY` | TV search, credits, and person images for cast cards. |
| `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX` | Optional image search fallback for headshots. |

If LLM keys are missing, the demo UI still loads; AI generation surfaces an error until keys are configured.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo board: [http://localhost:3000/demo](http://localhost:3000/demo).

```bash
npm run build   # production check
npm run lint
```

## Deploy

This app **must** run on a Node-capable host (Vercel, etc.) because of **API routes**. Connect the GitHub repo to Vercel, set the environment variables above, and deploy; production URL for this project: **https://charactermap.vercel.app/**.

## Repository

Primary shipping repo: **github.com/c4han-star/charactermap** (Vercel production). Other remotes may exist for coursework or forks—use the repo wired to Vercel for releases.

## Disclaimer

Relationship labels and images are **model- and search-assisted** and may not match broadcast canon or your memory. Treat the show as the source of truth for facts.

## Credits

- **Client** — Youngpyung Lee  
- **Developer** — Finnick Chen  

---

*Former working title in docs: “Character Relationship Tracker.” The product-facing name in the app is **Drama Relationship Map**.*

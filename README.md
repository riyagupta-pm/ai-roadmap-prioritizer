# AI Roadmap Prioritizer

Turn a raw problem statement into a structured product brief — goal, success metrics, user stories, RICE-scored feature prioritization, risks, and a phased roadmap — powered by Google's Gemini API.

**Live demo:** _add your deployed URL here_

## Why I built this

As a PM, I run the same manual sequence on almost every new problem: write the goal, list the candidate features, argue about priority order, write the risks, sketch a phased plan. I already do this with an LLM chat window open next to my doc — this project productizes that exact workflow into a single tool, instead of a conversation I have to re-start every time.

It's a small, honest test of the question I think every AI-first PM should be asking: not "can I add an AI feature to my product," but "can I remove a repetitive piece of my own job by giving it a proper interface."

## How it works

1. You enter a problem statement and (optionally) a list of candidate features.
2. The backend sends both to Gemini with a system prompt that constrains the output to a specific JSON schema — goal, metrics, user stories, RICE-scored priorities with rationale, risks, and a 3-phase roadmap.
3. The frontend renders it as a readable brief, and you can export it as Markdown.

RICE (Reach, Impact, Confidence, Effort) is calculated by the model per feature and used to sort the prioritization table — the model has to show its reasoning per feature, not just hand back a ranked list.

## My build workflow

I built this with Claude Code, using roughly this sequence:

1. **Scoped it as a product decision first, not a coding task** — decided the tool should solve *my own* recurring PM workflow (problem statement → prioritized brief) rather than a generic demo, since a tool with a real, specific user (me) forces better product decisions than a tool built to impress.
2. **Wrote the output schema before the UI** — designed the JSON shape (goal / metrics / stories / RICE table / risks / roadmap) first, since that schema *is* the product spec. The UI is just a renderer for it.
3. **Built backend → tested error paths → built frontend** — validated that missing inputs, a missing API key, and a failed upstream call all return clear, specific error messages before writing a single line of UI, since a demo that only works on the happy path isn't a demo of good judgment.
4. **Iterated the visual design as its own pass** — deliberately avoided the default "AI tool" look (cream background, purple gradient) in favor of a working-tool aesthetic that matches what a PM would actually want open next to their own docs.

## Tech stack

- **Backend:** Node.js + Express, single API route (`/api/generate-prd`) that proxies to the Gemini API server-side, so the API key never reaches the browser.
- **Frontend:** Vanilla HTML/CSS/JS — no framework, since the interaction surface (one form, one results view) didn't need one.
- **Model:** Gemini (`gemini-2.5-flash`), called with a schema-constrained system prompt and structured JSON output mode.

## Running it locally

```bash
git clone <your-repo-url>
cd ai-roadmap-prioritizer
npm install
cp .env.example .env   # add your GEMINI_API_KEY
npm start
```

Visit `http://localhost:3000`.

## Deploying

This runs as a standard Node/Express app, so it deploys as-is to Render, Railway, or Fly.io. To deploy on Vercel, wrap the Express app as a serverless function or convert `server.js`'s route into a Vercel API route — either way, set `GEMINI_API_KEY` as an environment variable in your hosting dashboard, never in the repo.

## What I'd build next

- Save/compare multiple briefs for the same problem, to see how prioritization shifts as inputs change.
- Let a team member comment on individual RICE scores and re-run with adjusted inputs.
- Support pasting in real customer feedback/tickets as additional context instead of just a free-text problem statement.

# Deployment

Both Render and Vercel need a one-time manual step that can't be scripted from
here: creating the account and authorizing GitHub access via an OAuth consent
screen in your browser. Everything else is prepared/config-as-code below, so
these should be quick once you're in.

## Backend (Render)

1. Sign up / log in at [render.com](https://render.com) (free tier is fine).
2. Dashboard -> **New** -> **Blueprint**.
3. Connect your GitHub account if prompted, then select `Hrudai-Nirmal/MajorProject-new`.
4. Render auto-detects `render.yaml` at the repo root (already committed) and
   proposes one web service: `cross-market-disclosure-api`, rooted at `backend/`,
   free plan, `pip install -r requirements.txt` / `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. You'll be prompted for 4 secret env vars (not stored in the repo):
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   (same values as in `backend/.env` locally)
6. Click **Apply**. First deploy takes a few minutes.
7. Note the service URL Render gives you (`https://cross-market-disclosure-api.onrender.com`
   or similar) — the frontend needs it.

Free tier note (already flagged in REQUIREMENTS.md): the service spins down
after ~15 min idle, ~30s cold start on the next request.

## Frontend (Vercel)

1. Sign up / log in at [vercel.com](https://vercel.com).
2. **Add New** -> **Project**, authorize GitHub access, select the same repo.
3. Vercel auto-detects Next.js. Set **Root Directory** to `frontend` (it's a
   monorepo — this is the one manual setting Vercel doesn't infer).
4. Add an environment variable: `NEXT_PUBLIC_API_URL` = the Render URL from
   step 7 above.
5. Deploy.

## After both are live

Tighten CORS in `backend/app/main.py` — it currently allows `*`
(`allow_origins=["*"]`, flagged in REQUIREMENTS.md §1.3 as temporary).
Change it to your actual Vercel domain:

```python
allow_origins=["https://your-project.vercel.app"],
```

Commit and push; Render auto-deploys on push (`autoDeploy: true` in `render.yaml`).

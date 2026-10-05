# ChetnaDhara

Privacy-first session prototype for the Aavishkar Category 6 brief. The product name in the interface is ChetnaDhara. This repository is the ManoVikas workspace.

The runnable slice is one child session for ADHD, ages 6–8:

1. A 30 second tap warm-up.
2. A sequence-recall game.
3. A calm close, entered on time or when touch pace spikes.
4. A hard stop. The child cannot start the game again from that screen.
5. A math gate, then one offline quest.
6. A caregiver screen with this sitting, a saved history, a cross-sitting dossier, and a one-page PDF.

Other conditions change the sensory theme and the offline quest. They do not add a second game. There is no camera, microphone, or video CDN.

## Run

API, from `apps/api`:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Web, from `apps/web`:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/v1` to the API. The session still plays if the API is off; the PDF needs the API.

PostgreSQL is defined in `docker-compose.yml` for a later phase. The prototype defaults to a local SQLite file, `apps/api/chetnadhara.db`. Redis in that same file caches the calm pack when the API is started with `REDIS_URL=redis://localhost:6379/0`.

## Checks

```powershell
cd apps\web
npm test
npm run build

cd ..\api
.\.venv\Scripts\python -m pytest
```

## What is real

- Sensory themes for ASD, ADHD, Dyslexia, Dyspraxia, and IDD, plus color-vision palettes and a low-luminance dark mode.
- Touch stress rules: tap rate, repeated hits in one spot, and fast drags.
- Judging pace (30s + 60s + 20s) and a clinical cap of age + 1 minutes.
- Rule-based session note, plus a dossier that accumulates only across completed sittings.
- Original calm pack (drawings and tone) served by the API and cached in the browser. Redis is an optional cache.
- Linear SHAP on the four session features after enough completed sittings of both kinds. Until then the rule score stays in place. Flower, Opacus, and IndicWav2Vec still respond as `not_configured`.

See `docs/plan.md` for the phase plan.

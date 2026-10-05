# ChetnaDhara phase plan

Locked for this prototype:

- One judge-facing path: child session, hard stop, offline quest, one-page caregiver PDF.
- Real activity: ADHD, ages 6–8, sequence recall.
- React + Vite PWA now. FastAPI and PostgreSQL-ready models behind it. No mobile shell yet.
- Touch telemetry only. No camera, microphone, or third-party video.
- English interface. Hindi is an empty string table.
- Session scores are rules. They are not a diagnosis.

## Phase 1 — Demo spine (this repository)

Sensory theme tokens, the three-stage clock, stress detection, parental math gate, offline quests, SQLite session storage, and the ReportLab PDF.

Judging pace is the default so the hard stop can be shown without waiting for the clinical cap. Clinical pace is a caregiver setting: 7, 8, or 9 minutes for ages 6, 7, and 8, with a 30 second warm-up and a 90 second calm close.

## Phase 2 — Caregiver history (implemented)

Completed sittings are stored on this device and on the API. The caregiver screen lists them and builds a dossier only from those sittings. Hero badges stay descriptive: a badge seen once says so, and a repeated badge counts sittings. One sitting does not become a cross-day pattern.

The calm close plays an original CC0 pack in `media/calm` (three still drawings and a soft tone). The service worker caches `/v1/media/calm/*`. Redis caches those bytes when `REDIS_URL` is set. Without Redis, the API reads the pack from disk.

## Phase 3 — Explainable models (implemented)

A linear model trains only on completed session summaries, using `sequence_accuracy`, `prompt_dependency`, `stress_ended`, and `warmup_taps`. It estimates whether a sitting matches this prototype's "extra support" pattern. Explanations are linear SHAP values: each feature's distance from the training average, times its weight.

The model is fit when at least six sittings include both quieter sessions and sessions that needed extra support. Otherwise the rule score remains the explanation. Strengths, focus lines, and badges stay on the rules either way.

## Phase 4 — Privacy across sites

Wire Flower and Opacus only after there is a model and a second site. Differential privacy applies to that training job. On-device storage stays encrypted. Nothing in Phase 4 turns the prototype into a diagnostic device.

## Phase 5 — Shell and language

Wrap the same session state and `/v1` API in a mobile shell if Anganwadi devices need it. Fill the Hindi catalog before any center pilot. Add further games only after the ADHD path has been used with a clinician advising on the copy.

## Out of scope until a clinical advisor joins

Saccadic eye tracking, phoneme capture, YouTube or other media CDNs, and any report that reads as a diagnosis or an IEP decision.

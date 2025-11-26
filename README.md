
# ❄️ SnowSense / SlipSense

Winter traction intelligence and road surface alerts. This repository contains a prototype mobile UI (Expo/React Native) and a Node/TypeScript server that together assess slip risk using camera vision, weather context, nearby slip history, and population-adjusted scaling.

Status: Prototype — significant work remains before a beta release. See “Planned Improvements”.

**Hosted API**: `https://cmt-winners.onrender.com/`

## What This Prototype Does
- Captures or uploads a road surface image and requests an AI risk assessment.
- Combines multiple signals: recent slip incidents near your location, current weather, AI vision score, and population density to produce a gradient-based risk level.
- Displays detailed result cards: Risk Assessment, Weather, Population Metrics, Nearby Slips, Risk Factors, Gradient Analysis, and Location.

## How It Works (Current Implementation)
- History decay: each nearby slip contributes weight using a half-life model.
	- Weight function: $w=0.5^{\frac{d}{25}+\frac{t}{36}}$, where $d$ is distance (km) and $t$ is time (hours) since the slip.
	- Shorter distance and more recent slips contribute more risk; contribution halves every ~25 km and every ~36 hours.
- Population variance: higher population density requires more corroborating slips to reach the same probability.
	- Required slips: $\text{slips}=1+\log_{10}\left(\frac{\text{pop}}{100}\right)\times4$.
	- Normalizer scales the historical score by the required slips and a reference weight at $(d=1\text{ km}, t=1\text{ hr})$.
- Weather analysis: transforms temperature and precipitation type into a multiplier in $[0,1]$.
	- Low temperatures (≤0°C) and winter precipitation (snow, sleet, freezing rain) raise risk.
	- Precipitation at near-freezing temps (e.g., rain/drizzle at ≤2°C) increases risk toward 0.8.
- Final probability: historical probability scaled by weather.
	- $\text{finalProb}=\min(1,\text{probHistory}\times(0.6+0.4\times\text{weatherMult}))$.
- AI vision analysis: an image-based road slip score normalized to $[0,1]$ contributes to overall risk factors and gradient.
- Gradient function: aggregates environmental risk (weather, temperature), historical risk (decayed slips), and combined risk, along with confidence.

Temperature explainer:
- Highest slip risk between −5°C and 0°C (23–32°F): partial melt creates a lubricating water layer.
- Above 10°C (50°F): ice fully melts, slip risk drops sharply.
- Below −15°C (5°F): ice is hard/dry, traction improves relative to near-freezing states.

## Repository Structure
- `snow-sense-ui/` — Expo React Native app with modularized screens/components.
- `Server/` — Node + TypeScript service exposing risk assessment routes and helpers (see `src/services/risk.services.ts`).

## Running Locally
Prerequisites: Node.js (LTS), npm/yarn.

UI (Expo):
```bash
cd snow-sense-ui
npm install
npx expo start
```

Server:
```bash
cd Server
npm install
npm run dev
```

Environment
- UI reads API base URL from its environment/config; ensure it targets `https://cmt-winners.onrender.com/` or your local server.
- Server requires standard env for port, DB, and external APIs if configured (see `Server/.env`).

### Important: Do NOT Run Population Seeding on Hosted Server
- The hosted API at `https://cmt-winners.onrender.com/` is owned and managed by Rohan. Do not run any population or slip data seeding scripts against this hosted instance.
- Only run seeding scripts (e.g., `Server/src/tests/seedSlipData.ts`) on your own locally hosted server environments.
- If you need sample data, spin up your local server and run the seed script there. Do not attempt to modify or populate the production-hosted database.

### Example .env files

Server (`Server/.env`):
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
WEATHER_API_KEY=<your_openweathermap_key>
WORLDPOP_URL=https://worldpop.arcgis.com/arcgis/rest/services/WorldPop_Population_Density_1km/ImageServer/identify
GROQ_API_KEY=<your_groq_api_key>
CLINE_URL=https://api.cline.io/v1
```

UI (`snow-sense-ui/.env`):
```
SERVER_URL=https://cmt-winners.onrender.com/
EXPO_PUBLIC_SERVER_URL=https://cmt-winners.onrender.com/

# (Optional) Firebase if using Auth
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Planned Improvements (Prototype → Beta)
- Notifications: timely, non-intrusive alerts for traction risk ahead.
- Black ice ML (OpenCV): on-device or server-side vision models for thin ice detection.
- Telemetry: improved car positioning and sensor fusion; potential OBD-II integration.
- UI/UX: continuous feed panels, smoother charts, map overlay layers.
- Security: hardened API endpoints, rate limiting/hit-rate controls, auth.
- Integrations: speedometer analysis, driver coaching overlays, historical trip summaries.

## What You Can See Today (Prototype Highlights)
- AI Vision: Upload/capture road images and see a normalized slip score with confidence.
- Weather Context: Temperature and precipitation factors visualized with explainers.
- Population Metrics: Density-adjusted normalizer indicating how many corroborated slips are needed.
- Nearby Slips: Time- and distance-decayed incidents with map deep links.
- Gradient Analysis: Side-by-side environmental vs historical vs combined risk with confidence.
- Location & Maps: Quick open-in-maps from assessed coordinates.

## Why This Can Revolutionize Winter Driving
- Preventive intelligence: Subtle warnings before the driver reaches low-traction segments.
- Pure mobile-first: Works with commodity smartphones; optional OBD-II augments accuracy.
- Community amplification: Anonymized aggregation builds real-time risk maps for everyone.
- Context-aware modeling: Blends weather, population, and history instead of single-signal heuristics.
- Scalable and privacy-respecting: On-device preprocessing where possible, rate-limited APIs, aggregated insights.

## Credits & Contributions
- Concept & Development (end-to-end): Rohan Rajendra Dalvi
- team member (authentication & presentation): Chinmay Mishra

Contributions welcome — open issues/PRs. For collaboration, contact: `dalvi.ro@northeastern.edu`.

## Obtaining Required API Keys
- OpenWeatherMap (Weather): Create an account at `https://openweathermap.org/api` and generate an API key; set `WEATHER_API_KEY` in `Server/.env`.
- GROQ (AI): Sign up at `https://console.groq.com/` and create an API key; set `GROQ_API_KEY` in `Server/.env`.
- MongoDB Atlas (Database): Create a free cluster at `https://www.mongodb.com/cloud/atlas` and use your connection string in `MONGO_URI`.
- WorldPop (Population Density): We call the public ImageServer endpoint in `WORLDPOP_URL` (already included) — no key required.
- Firebase (optional Auth/analytics on UI): Create a Firebase project at `https://firebase.google.com/` and copy the web config into `snow-sense-ui/.env` under the `EXPO_PUBLIC_FIREBASE_*` variables.



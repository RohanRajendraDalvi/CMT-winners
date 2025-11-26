# SnowSense UI (Expo/React Native)

Prototype mobile UI for winter traction intelligence and road surface risk assessment.

## What it shows
- AI Risk Assessment screen for uploading/capturing road images.
- Result cards: Risk Assessment, Weather, Population Metrics, Nearby Slips, Risk Factors, Gradient Analysis, and Location.
- Temperature/precipitation explainers for user context.

Prototype status: work-in-progress; see root README for details and planned improvements.

## Prerequisites
- Node.js LTS
- npm or yarn
- Expo CLI (installed via `npx` automatically)

## Setup & Run
```bash
npm install
npx expo start
```

By default, the UI calls the hosted server: `https://cmt-winners.onrender.com/`. You can point to a local server by updating the API config in `src/api/AIrisk.js` or related files.

## Structure
- `App.js` — entry point.
- `src/components/airisk/` — modular cards and `AIRiskScreen`.
- `src/api/` — API interfaces (AI risk, slips, maps, firebase).
- `src/styles/` — shared styles.

## Notes
- This is a UI prototype; many features are placeholders.
- Risk math and weather logic are implemented on the server; the UI visualizes returned fields including population metrics and gradient analysis.


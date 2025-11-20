
# ❄️ SlipSense


## Road Surface Alerts UI + Winter Traction Intelligence



### 🚗 Overview

Winter driving accidents rise sharply due to hidden traction loss on black ice and snow-covered roads. **SlipSense** is a GenAI-powered mobile system that detects micro-slips and traction risks in real time using only smartphone sensors (and optionally, vehicle OBD data). The app nudges drivers with subtle “⚠️ Traction Risk Ahead” alerts and provides post-trip coaching to help them adapt driving behavior safely in winter conditions.


---
## ❄️ Vision
Winter driving accidents rise due to invisible traction loss (black ice, compacted snow). **SnowSense** aims to detect micro-slips using smartphone sensors (and optionally OBD-II) and provide timely gentle warnings ("⚠️ Traction risk ahead") plus post-trip coaching.

---
## 🚗 UI Prototype (snow-sense-ui)
### Features
- Report slip events manually (simulation)
- Detect nearby reported slips (mocked)
- Dark theme mobile layout

### Running
```bash
cd snow-sense-ui
npm install
npx expo start
```

---
## 🧠 How It Works (Concept)
1. Sensor fusion: IMU (accelerometer, gyroscope) + GPS (+ optional OBD data)
2. Feature extraction: lateral jerk, traction index, micro-slip signatures
3. Adaptive modeling: on-device anomaly thresholds adjust per driver/context
4. Feedback loop: real-time minimal alerts + end-of-trip coaching summary
5. Aggregation: anonymized tile-based risk heatmaps (privacy preserving)

---
## 🧩 Data Pipeline (Planned)
| Stage | Input | Output |
|-------|-------|--------|
| Ingestion | IMU, GPS, OBD | Raw time series |
| Extraction | Time windows | Jerk, slip indicators |
| Scoring | Features + context | Traction risk score |
| Alerting | Score threshold | User notification |
| Aggregation | Multiple users | Risk map tiles |

---
## 📊 Potential Metrics
- Reduction in risky maneuvers
- Improved speed compliance in low traction zones
- Driver adaptation rate over time

---
## 🔒 Privacy Principles
- Processing & scoring on-device
- Shared data are aggregated & anonymized
- Opt-in for community risk map contribution

---
## 🧰 Tech Stack (Target)
- UI: React Native / Expo
- ML: TensorFlow Lite / PyTorch Mobile (future)
- APIs: Weather + optional OBD-II adapter
- Backend (optional): FastAPI / Firebase for aggregated tiles

---
## 🚀 Roadmap
- Refine slip detection model
- Integrate real weather layers
- Add passive automatic slip sensing
- Gamified safety & community alerts

---
## 👥 Credits
- UI Prototype Author: Chinmay Mishra
- Concept & Architecture: SnowSense Team

---
## Contributing
Pull requests welcome. For major changes, open an issue first to discuss.



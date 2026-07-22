<div align="center">
  
  # 🏭 FacCheck AI
  
  **An AI-driven predictive maintenance platform that monitors industrial machine health, analyzes high-frequency telemetry, and visualizes real-time digital twins.**
  
  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" /></a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square" alt="Recharts" />
    <img src="https://img.shields.io/github/license/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="License" />
    <img src="https://img.shields.io/github/stars/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="Stars" />
    <img src="https://img.shields.io/github/forks/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="Forks" />
    <img src="https://img.shields.io/github/issues/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="Issues" />
    <img src="https://img.shields.io/github/last-commit/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="Last Commit" />
    <img src="https://img.shields.io/github/repo-size/MaybeSomeone-arc18/fac-Check.ai?style=flat-square" alt="Repo Size" />
  </p>

  
</div>

---

## 📑 Table of Contents

<details>
<summary>Click to expand</summary>

- [Overview](#-overview)
- [Why FacCheck AI?](#-why-faccheck-ai)
- [Features](#-features)
- [System Design & Architecture](#-system-design--architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Run Project](#-run-project)
- [API & WebSockets](#-api--websockets)
- [AI Workflow & Features](#-ai-workflow--features)
- [Performance](#-performance)
- [Future Vision & Roadmap](#-future-vision--roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Developer](#-developer)

</details>

---

## 🔭 Overview

**FacCheck AI** is a full-stack, AI-driven predictive maintenance platform engineered to monitor, analyze, and visualize industrial machine health. By combining a realistic simulation of high-frequency sensor telemetry with machine learning, the platform accurately predicts failure probabilities before they cause downtime.

The system features a real-time WebSocket architecture that feeds live telemetry directly into a sleek, futuristic UI dashboard complete with interactive 3D digital twins.

---

## 🏆 Why FacCheck AI?

Unplanned downtime in manufacturing and industrial sectors costs millions of dollars annually. Traditional maintenance is purely reactive (fixing things after they break) or rigidly preventative (replacing parts on a strict schedule, regardless of actual wear).

- **Proactive AI Maintenance:** Transition to predictive maintenance—fixing machines exactly when they are about to fail using a Scikit-Learn Random Forest model.
- **Real-Time Digital Twins:** Instead of flat graphs, monitor actual 3D WebGL models that change state and materials dynamically based on live heat and vibration data.
- **Premium UX:** Built to feel like a high-end sci-fi command center with smooth Framer Motion animations, glassmorphism UI, and customized SVG telemetry charts.

---

## ✨ Features

| Feature | Description | Status | Examples |
|:---|:---|:---:|:---|
| **Real-Time Telemetry** | WebSocket-powered architecture delivering sub-second sensor updates | ✅ | Emits live `machine_telemetry` |
| **AI Failure Prediction** | Integrated ML model assigning risk levels based on 10D vectors | ✅ | Detects anomalies on the fly |
| **Interactive Digital Twins**| React Three Fiber 3D models representing live machine health | ✅ | Colors shift from green to red |
| **Dynamic Fleet Filtering** | Instantly filter global fleets by type and risk level | ✅ | Isolate "High Risk Machines" |
| **Responsive UI** | Flawless glassmorphism experience across all breakpoints | ✅ | Adapts to mobile/desktop |
| **Live Analytical Charts** | Custom Recharts and SVG sparklines updating dynamically | ✅ | OEE & Yield metrics |
| **Event Logging** | Automated notification system tracking critical machine events | ✅ | History of warnings/errors |
| **Theme Customization** | Dark mode UI with system preference syncing | ✅ | Persistent via `localStorage` |

---


## 📊 System Design & Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │                      REACT UI                          │
 │  (Next.js, Tailwind, Zustand, Recharts, Three.js)      │
 └──────────────────────────┬─────────────────────────────┘
                            │ (WebSockets & REST)
 ┌──────────────────────────▼─────────────────────────────┐
 │                     API LAYER                          │
 │      (Socket.io Multiplexing & Request Handlers)       │
 └──────────────────────────┬─────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │                   EXPRESS SERVER                       │
 │      (Node.js, Simulation Engine, Socket Manager)      │
 └─────────────┬───────────────────────────┬──────────────┘
               │                           │
 ┌─────────────▼──────────────┐  ┌─────────▼──────────────┐
 │         DATASET            │  │        AI ENGINE       │
 │  (CSV Telemetry Stream)    │  │ (Random Forest ML)     │
 └────────────────────────────┘  └────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 / Next.js (App Router)
- **Styling:** Tailwind CSS (Glassmorphism & Cyber-Industrial UI)
- **Animations:** Framer Motion
- **3D Rendering:** React Three Fiber / Drei
- **Data Visualization:** Recharts & Custom SVGs
- **State Management:** Zustand
- **Networking:** Socket.io Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-Time:** Socket.io
- **Data Loading:** Fast CSV Loader

### Machine Learning
- **Model:** Random Forest Classifier (Scikit-learn)
- **API Engine:** Python / FastAPI
- **Data Processing:** Pandas / NumPy

---

## 📁 Project Structure

```text
fac-Check/
├── backend/
│   ├── src/
│   │   ├── services/       # CSV Loader, AI inference, Telemetry simulation
│   │   ├── websocket/      # Socket.io room management
│   │   └── index.js        # Express Server entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js routes (Dashboard, Analytics, Alerts)
    │   ├── components/     # UI, 3D Models, Charts, Metric Cards
    │   ├── lib/            # Utility functions
    │   ├── services/       # Socket.io service layer
    │   ├── store/          # Zustand state management
    │   └── styles/         # Global CSS
    ├── tailwind.config.ts  
    └── package.json
```

---

## 🚀 Installation

Follow these steps to get the project running locally.

**1. Clone the repository**
```bash
git clone https://github.com/MaybeSomeone-arc18/fac-Check.ai.git
cd fac-Check.ai
```

**2. Install Backend Dependencies**
```bash
cd backend
npm install
```

**3. Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

Create `.env` files in both backend and frontend directories:

**Backend (`backend/.env`):**
| Variable | Description | Example |
|:---|:---|:---|
| `PORT` | The port for the Express server | `3001` |
| `CSV_PATH` | Path to telemetry dataset | `./predictive_maintenance_dataset.csv` |

**Frontend (`frontend/.env.local`):**
| Variable | Description | Example |
|:---|:---|:---|
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | REST API server URL | `http://localhost:3001/api` |

---

## ⚡ Run Project

You will need two terminal windows to run both the frontend and backend simultaneously.

### Development

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🌐 API & WebSockets

While primary data flows via WebSockets, the backend also exposes standard REST API endpoints for initial configurations.

### WebSocket Events
- **`subscribe_machine` / `unsubscribe_machine`**: Manage active telemetry listeners to conserve bandwidth.
- **`machine_telemetry`**: Emitted ~10 times a second containing live sensor payloads and AI risk scores.

### REST Endpoints
- `GET /api/machines` - Retrieve registered machine fleet
- `GET /api/alerts` - Fetch recent anomaly logs
- `GET /api/analytics/history` - Fetch historical OEE and Yield metrics

---

## 🧠 AI Workflow & Features

FacCheck AI seamlessly integrates a **Scikit-learn Random Forest Model** to elevate operations from passive tracking to proactive management.

- **Risk Classification:** Evaluates 10-dimensional sensor feature vectors to predict failure probabilities.
- **Categorization:** Classifies incoming live streams into statuses: NOMINAL, WARNING, and CRITICAL.
- **Automated Alerts:** When anomaly thresholds are breached, the AI triggers immediate visual alerts on the dashboard and event logs.
- **Digital Twin Sync:** Risk levels are actively bound to the React Three Fiber materials, turning a healthy blue model into a glowing red model dynamically.

---

## ⚡ Performance

- **Zustand Granular Subscriptions:** Telemetry store uses advanced selector mechanisms so only individual Machine Cards re-render upon WebSocket pings, rather than the entire dashboard.
- **Socket Multiplexing:** The application avoids heavy REST polling. As you navigate between global dashboards and machine detail views, the frontend dynamically joins and leaves Socket.io rooms, optimizing network bandwidth.
- **Decoupled 3D Rendering:** The 3D Digital Twin canvas leverages `memo` and strictly segregated state to prevent React from re-rendering the heavy WebGL context when overlay UI updates occur.
- **Immutable Rolling Buffers:** Sanitizes corrupt payloads (`Number.isFinite`) and precisely synchronizes dynamic SVG sparklines with updating numeric DOM elements.

---

## 📈 Future Vision & Roadmap

- [ ] **Hardware Integration API:** Allow real PLCs / IoT gateways to replace the CSV simulator.
- [ ] **Advanced AI Models:** Expand the ML pipeline with LSTM neural networks for advanced time-series forecasting.
- [ ] **VR/AR Digital Twin:** Immersive diagnostic capabilities utilizing WebXR.
- [ ] **Real-time Collaboration:** Multiple operators interacting with the same digital twin.
- [ ] **Email & Slack Notifications:** Push notifications for critical machine alerts.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Developer

<div align="center">
  <h3>Made with ❤️ by Sanskar Kharya</h3>
  
  <p>
    <a href="https://github.com/MaybeSomeone-arc18"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
    <a href="#"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Portfolio-2563EB?style=for-the-badge&logo=react&logoColor=white" alt="Portfolio" /></a>
    <a href="mailto:contact@example.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
  </p>

  <br/>

  <!-- Extras Section -->
  <img src="https://komarev.com/ghpvc/?username=MaybeSomeone-arc18&label=Profile%20Views&color=0e75b6&style=flat" alt="Visitor Counter" />
  
  <br/><br/>

</div>

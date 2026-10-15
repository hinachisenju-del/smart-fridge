# Smart List

**Smart List** is a modern, high-performance grocery SaaS and household inventory management application featuring relational multi-list persistence, a vibrant design system with zero-flash dark mode, and an embedded local Scikit-Learn Machine Learning service for predictive pantry restock.

Built on a strict **₹0 budget** with 100% open-source technologies (no paid APIs, no cloud lock-in).

---

## Architecture Overview

```text
smart-list/
├── frontend/             # React 18 + TypeScript + Vite 6 + Tailwind CSS
│   ├── src/components/   # Dashboard, Shopping List, My Lists, Inventory, Expiry Alerts, Settings
│   ├── src/components/reactbits/  # AnimatedList, CompletionProgress, EmptyState, MlSuggestionsCard
│   ├── src/context/      # ThemeContext (Light, Dark, System OS-synced)
│   ├── test/             # Automated test suite (notifications, theme)
│   └── screenshots/      # Automated E2E verification captures
├── backend/              # Java 17 + Spring Boot 3.3.5 + Maven
│   ├── src/main/java/    # Multi-list persistence, REST controllers, ML suggestion service
│   ├── src/test/java/    # 28 passing unit & integration tests
│   └── data/             # File-backed H2 dev database (smart-fridge-dev.mv.db)
├── ml_service/           # Python 3 + FastAPI + Scikit-Learn
│   ├── predictor.py      # Dual RandomForest pipeline (depletion time & urgency classifier)
│   ├── train_and_evaluate.py  # Model trainer, metric exporter, synthetic baseline evaluation
│   ├── app.py            # Local inference daemon (Port 8082)
│   └── test_ml_predictor.py   # Automated unit tests
└── verify_smart_list.mjs # Headless Puppeteer E2E validation script
```

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS (Electric Indigo `#4F46E5`, Vivid Tangerine `#F97316`, Fresh Lime `#84CC16`), Lucide React.
- **Backend:** Java 17, Spring Boot 3.3.5, Spring Data JPA, Hibernate ORM, Maven Wrapper.
- **Persistence:** H2 file-backed local database (`jdbc:h2:file:./data/smart-fridge-dev`), optional PostgreSQL profile (`postgres`).
- **Machine Learning:** Python, FastAPI, Scikit-Learn (`RandomForestRegressor`, `RandomForestClassifier`), Joblib, NumPy.
- **Testing:** JUnit 5, Mockito, Node.js Native Test Runner, Puppeteer.

---

## Running the Application Locally

The application runs on three decoupled local ports:

| Service | Port | Endpoint / Description |
| :--- | :--- | :--- |
| **Frontend** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | `8081` | [http://localhost:8081](http://localhost:8081) (`/api/health`, `/api/shopping-lists`, `/api/groceries`, `/api/ml/suggestions`) |
| **ML Service** | `8082` | [http://localhost:8082](http://localhost:8082) (`/health`, `/predict`, `/evaluate`) |

*(Note: Port 8081 is used for Spring Boot because Oracle TNSLSNR typically occupies port 8080 on developer workstations).*

### 1. Start the Machine Learning Microservice

In a Windows PowerShell window:
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\ml_service"
python app.py
```
*Health check:* [http://localhost:8082/health](http://localhost:8082/health)

### 2. Start the Spring Boot Backend

In a second Windows PowerShell window:
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\backend"
.\mvnw.cmd spring-boot:run
```
*Health check:* [http://localhost:8081/api/health](http://localhost:8081/api/health)

### 3. Start the Frontend Dev Server

In a third Windows PowerShell window:
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\frontend"
npm run dev -- --host
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Test Suites

### Backend Tests (28 passing tests)
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\backend"
.\mvnw.cmd test
```

### Frontend Tests (7 passing tests)
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\frontend"
npm test
```

### ML Engine Tests (6 passing tests)
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge\ml_service"
python -m unittest test_ml_predictor.py
```

### Automated End-to-End Verification (Puppeteer)
```powershell
Set-Location "C:\Users\1306s\.gemini\antigravity\scratch\smart-fridge"
node verify_smart_list.mjs
```
Captures production screenshots across desktop and mobile viewports in `frontend/screenshots/`.

---

## Key Features

1. **Multi-List Management:** Create, color-code, iconify, switch, archive, and delete isolated shopping lists.
2. **Smart Restock Predictor:** Scikit-Learn Random Forest models predict pantry depletion timing and urgency with 85.7% error reduction over baseline, cold-start detection, and explicit user-approval safety.
3. **Zero-Flash Dark Mode:** Instant theme resolution via anti-FOUC inline header script, manual toggle, and live OS `prefers-color-scheme` listener.
4. **React Bits Componentry:** Accessible animated completion progress, entry transitions, and contextual empty states without runtime bloat.
5. **Freshness Tracking & Local Notifications:** Built-in shelf-life monitoring and private browser notifications (zero external relays).
6. **Budget Optimization:** Real-time calculation of pending expenditure, price per unit tracking, and completed purchase summaries.

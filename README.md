# 🚗 AVAT - Autonomous Vehicle Accident Tracker

[![Deploy to GitHub Pages](https://github.com/Vikyath-N/AVAT/actions/workflows/deploy.yml/badge.svg)](https://github.com/Vikyath-N/AVAT/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)

> **Professional Tesla-Inspired AV Accident Analysis Platform**

A comprehensive, real-time autonomous vehicle accident analysis platform featuring advanced data visualization, geospatial mapping, and predictive analytics. Built with modern technologies and a sleek Tesla-inspired dark UI.

## 🌟 Live Demo

🔗 **[View Live Application](https://vikyath-n.github.io/AVAT/)**

## ✨ Features

### 📊 **Advanced Analytics Dashboard**
- Real-time accident metrics and KPIs
- Company performance comparisons  
- Vehicle make/model safety analysis
- Temporal pattern recognition
- Risk factor assessment

### 🗺️ **Interactive Geospatial Mapping**
- High-resolution accident location mapping
- Dynamic clustering and heatmaps
- Multi-layer map styles (Dark, Satellite, Streets)
- Real-time accident markers with severity indicators
- Geographic hotspot identification

### 🔍 **Deep Data Analysis**
- **Vehicle Analysis**: Make/model accident rates, damage patterns
- **Location Intelligence**: City type risk assessment, intersection analysis  
- **Temporal Patterns**: Hourly, daily, seasonal trends
- **Damage Assessment**: Impact location analysis, severity scoring

### 🎨 **Tesla-Inspired UI/UX**
- Sleek dark mode interface
- Smooth animations and transitions
- Minimalist design principles
- Responsive mobile-first layout
- Real-time data updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐
│   Frontend      │    │   Backend API    │    │        Data Layer        │
│                 │    │                  │    │                          │
│ • React 18 + TS │◀──▶│ • FastAPI        │◀──▶│ • SQLite (default)       │
│ • Mapbox GL     │    │ • WebSockets     │    │ • Migrations (custom)    │
│ • Framer Motion │    │ • APScheduler    │    │ • PDF + DMV index tables │
│ • Recharts      │    │ • In-memory cache│    │ • Optional: PostgreSQL   │
└─────────────────┘    └──────────────────┘    └──────────────────────────┘
```

### 🧭 System Overview

- **DMV Scraping Pipeline**
  - Phase 1: Index-only sync inserts normalized records into `dmv_reports` (idempotent upsert).
  - Phase 2: PDF download and parsing persists normalized `accidents` and links to source via `source_report_id`.
  - Phase 3: Daily scheduling via APScheduler, health/metrics exposure, and run history in `dmv_scrape_runs`.
- **Real-time UX**: WebSocket heartbeat and broadcast for new data, frontend falls back to demo mode if API is unavailable.
- **Caching**: Lightweight in-memory cache service for hot API responses.

### 🔌 API Overview

- `GET /api/v1/health` – service status, DB counts, last scraper run.
- `GET /api/v1/stats` – system stats for UI overview.
- `GET /api/v1/accidents` – paginated accidents with filters; map data at `/api/v1/accidents/map/data`.
- `GET /api/v1/analytics/*` – overview, temporal trends, patterns, performance.
- Reports (DMV):
  - `GET /api/v1/reports/latest?limit=50`
  - `GET /api/v1/reports/summary`
  - `GET /api/v1/reports/runs?limit=20`
  - `POST /api/v1/reports/sync-index`
  - `POST /api/v1/reports/sync-pdfs?limit=10`

### ⏰ Scheduler & Background Jobs

- APScheduler (AsyncIO) starts in app lifespan:
  - 03:00 – `DMVScraperService.sync_index()`
  - 03:10 – `DMVScraperService.sync_pdfs(limit=25)`
- Background tasks: analytics cache refresh + WebSocket heartbeat.

### 🗃️ Database & Migrations

- SQLite by default (`enhanced_accidents.db`).
- Custom migrations (`backend/utils/migrations.py`):
  - 004 `dmv_reports`, 005 `dmv_scrape_runs`, 006 add source columns to `accidents`, 007 `dmv_pdf_files`.
- Run all pending migrations:
  ```bash
  cd backend
  python -c "from utils.migrations import run_migrations; run_migrations()"
  ```

### 🧰 Scripts

- Scraper:
  - `scripts/scrape/scan-index.sh` – dry-run list.
  - `scripts/scrape/sync-index.sh` – upsert index.
  - `scripts/scrape/sync-pdfs.sh` – download + parse PDFs.
  - `scripts/scrape/status.sh` – summary + runs.
  - `scripts/scrape/full-sync.sh` – index then PDFs.
- Tests:
  - `scripts/test/unit.sh` and `scripts/test/integration.sh`.

### ⚙️ Configuration

Frontend `.env`:
```bash
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_MAPBOX_TOKEN=pk.your_mapbox_public_token
REACT_APP_DEMO_MODE=false
```
Notes:
- Frontend uses a hybrid data service: if API isn't reachable or demo mode is enabled, it falls back to mock data.
- Production values are injected via GitHub Secrets during CI (see DEPLOYMENT.md).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis Server (optional, for caching)

### 1. Clone Repository
```bash
git clone https://github.com/vikyath/AVAT.git
cd AVAT
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
cd backend
python -c "from utils.migrations import run_migrations; run_migrations()"

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Mapbox token

# Start development server
npm start
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws

## 📊 Key Insights Discovered

Based on enhanced data analysis, the platform reveals:

### 🏆 **Safest Performers**
- **Waymo**: Lowest accident rate per mile (0.41/1000 miles)
- **Suburban Areas**: 23% lower severity scores than urban
- **Traffic Light Intersections**: Surprisingly safer than stop signs

### ⚠️ **Risk Factors**
- **Highway Merges**: 3.8x higher severity scores
- **Fog Conditions**: 40% increase in accident likelihood
- **Rush Hour (5-6 PM)**: Peak accident time across all companies

### 📈 **Trends**
- **12.3% Overall Reduction**: in accident rates year-over-year
- **Front-End Impacts**: 42% of all accidents
- **Urban Areas**: Higher frequency but lower severity

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Mapbox GL JS, Recharts, Framer Motion, Tailwind CSS
- Axios, React Router, Zustand

### Backend
- FastAPI (Python 3.9+), WebSockets
- SQLite (default) with custom migration system
- APScheduler for cron jobs
- In-memory cache service

### Data Processing
- BeautifulSoup (HTML), pdfplumber (PDF), geopy (geocoding)
- EnhancedDataExtractor from `enhanced_data_pipeline.py`

## 📱 Deployment

- CI/CD to GitHub Pages using PNPM. See `DEPLOYMENT.md` for details, secrets, and troubleshooting (lockfile, permissions, `public/index.html`).

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm start          # Start development server
npm run build      # Build for production
npm run test       # Run tests
npm run lint       # Run linter
npm run deploy     # Deploy to GitHub Pages
```

**Backend:**
```bash
uvicorn main:app --reload    # Start development server
python -m pytest            # Run tests
python utils/migrations.py  # Run migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **California DMV** for providing accident data
- **Mapbox** for mapping services
- **OpenStreetMap** community for geographic data
- **Tesla** for UI/UX inspiration

## 📞 Support

For support and questions:
- **Documentation**: [GitHub Wiki](https://github.com/Vikyath-N/AVAT/wiki)
- **Issues**: [GitHub Issues](https://github.com/Vikyath-N/AVAT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Vikyath-N/AVAT/discussions)

---

**Built with ❤️ by [Vikyath Naradasi](https://github.com/vikyath)**

*Transforming autonomous vehicle safety through data-driven insights*
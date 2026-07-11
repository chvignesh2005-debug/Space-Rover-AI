# Space-Rover-AI Backend

A production-ready **FastAPI** backend for the Space-Rover-AI platform.

## Architecture

```
backend/
├── ai/
│   └── openai_service.py       # OpenAI GPT wrapper (key read from .env only)
├── api/
│   ├── routes/
│   │   ├── health.py           # GET /api/v1/health
│   │   └── predict.py          # POST /api/v1/predict
│   └── __init__.py             # Mounts all routes under /api/v1
├── app/
│   ├── config.py               # Pydantic Settings — loads from .env
│   └── main.py                 # FastAPI app, CORS, lifespan startup
├── ml/
│   └── model_loader.py         # Loads model.pkl if present; else mock
├── models/
│   └── schemas.py              # All Pydantic request / response models
├── services/
│   └── prediction_service.py   # Business logic for predictions
├── utils/
│   └── logger.py               # Structured logging setup
├── .env.example                # Environment variable template
├── requirements.txt            # Python dependencies
└── run.py                      # Convenience entry-point
```

## Endpoints

| Method | Path             | Description                              |
|--------|------------------|------------------------------------------|
| GET    | `/`              | Service root / version info              |
| GET    | `/api/v1/health` | Liveness probe — reports model status    |
| POST   | `/api/v1/predict`| Fault prediction from telemetry snapshot |
| GET    | `/docs`          | Interactive Swagger UI                   |
| GET    | `/redoc`         | ReDoc API reference                      |

## Quick Start

### 1. Create the virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
copy .env.example .env   # Windows
# OR
cp .env.example .env     # macOS / Linux
```

Edit `.env` and set your `OPENAI_API_KEY`.  
The key is **never** hardcoded — it is always read from `.env`.

### 4. (Optional) Place a trained model

Copy your trained `model.pkl` to:

```
ml_model/model.pkl
```

If the file is absent the API automatically falls back to rule-based mock predictions.

### 5. Run the backend

```bash
# Option A — convenience script
python run.py

# Option B — uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## Example Request

```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "battery": 35.0,
    "solar_output": 320,
    "speed": 0.14,
    "temperature": -52.0,
    "latency": 138,
    "power_draw": 260
  }'
```

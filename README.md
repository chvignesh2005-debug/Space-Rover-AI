# Space-Rover-AI

An AI-powered system for autonomous space rover navigation, mapping, and scientific discovery.

## Project Structure

```text
Space-Rover-AI/
├── backend/            # Python-based Backend (API, Models, Services)
│   ├── ai/
│   ├── api/
│   ├── app/
│   ├── database/
│   ├── ml/
│   ├── models/
│   ├── services/
│   └── utils/
├── dataset/            # Training/validation data and artifacts
├── docs/               # Project documentation
├── frontend/           # React/Vite-based Frontend
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   └── src/
├── ml_model/           # Saved model checkpoints and weights
├── reports/            # Performance and analysis reports
├── .env.example        # Environment variables template
├── .gitignore          # Git exclusion rules
├── package.json        # Frontend/Tooling dependencies and scripts
├── README.md           # This file
└── requirements.txt    # Backend Python dependencies
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository and navigate to the project root.
2. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
3. Set up the backend:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Development

- **Backend development**: Refer to backend documentation in `docs/` or start server from `backend/app/`.
- **Frontend development**: Refer to `frontend/README.md` or start local server with `npm run dev`.

/**
 * services/api.ts
 *
 * Centralised Axios client for the Space-Rover-AI FastAPI backend.
 * The base URL is driven by the Vite environment variable VITE_API_URL
 * (set in frontend/.env or Vite config), defaulting to localhost:8000.
 */

import axios from 'axios';

// ── Axios Instance ──────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — log outgoing calls in development
apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  }
  return config;
});

// Response interceptor — surface error details
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail ?? error.message;
    console.error('[API Error]', detail);
    return Promise.reject(new Error(detail));
  },
);

// ── Types ───────────────────────────────────────────────────────────────────

export interface TelemetryInput {
  battery?: number;
  solar_output?: number;
  speed?: number;
  temperature?: number;
  latency?: number;
  coordinates_x?: number;
  coordinates_y?: number;
  coordinates_z?: number;
  heading?: number;
  power_draw?: number;
}

export interface FaultPrediction {
  fault_type: string;
  probability: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  recommended_action: string;
}

export interface PredictionResponse {
  prediction_id: string;
  timestamp: string;
  model_used: 'model.pkl' | 'mock';
  input_features: Record<string, unknown>;
  fault_predictions: FaultPrediction[];
  overall_health_score: number;
  navigation_safe: boolean;
  summary: string;
}

export interface HealthResponse {
  status: string;
  environment: string;
  model_loaded: boolean;
  version: string;
  message: string;
}

// ── API Methods ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/health
 * Check whether the backend and ML model are online.
 */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

/**
 * POST /api/v1/predict
 * Submit rover telemetry and receive ML fault predictions.
 */
export async function postPredict(payload: TelemetryInput): Promise<PredictionResponse> {
  const { data } = await apiClient.post<PredictionResponse>('/predict', payload);
  return data;
}

export default apiClient;

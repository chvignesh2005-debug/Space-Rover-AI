/**
 * services/api.ts
 *
 * Centralised API client for the Space-Rover-AI FastAPI backend.
 * The base URL is driven by the Vite environment variable VITE_API_URL
 * and defaults to the production Render endpoint.
 */

import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'https://space-rover-ai-3.onrender.com/api/v1').replace(/\/+$/, '');

// ── Axios Instance ──────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 120000,
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
function extractErrorMessage(error: any): string {
  const detail = error.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  // FastAPI validation errors (HTTP 422) return `detail` as an array of
  // {loc, msg, type} objects rather than a plain string.
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item: any) => (typeof item?.msg === 'string' ? item.msg : JSON.stringify(item)))
      .join('; ');
  }

  return error.message ?? 'Unknown error';
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = extractErrorMessage(error);
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
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

export interface AIResponse {
  reply: string;
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

/**
 * POST /api/v1/ai/chat
 * Send a prompt to the OpenAI-backed AI assistant and receive its reply.
 *
 * NOTE: the backend route is registered at /api/v1/ai/chat (see
 * backend/api/ai.py), and expects a JSON body of the shape
 * `{ "message": string }`, returning `{ "reply": string }`.
 */
export async function askAI(prompt: string): Promise<AIResponse> {
  const { data } = await apiClient.post<AIResponse>('/ai/chat', {
    message: prompt,
  });
  return data;
}

export async function postChatMessage(message: string): Promise<{ reply: string }> {
  const { data } = await apiClient.post<{ reply: string }>('/ai/chat', { message });
  return data;
}

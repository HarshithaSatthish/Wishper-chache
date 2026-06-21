export interface AnalysisResult {
  success: boolean;
  anomaly_score: number;
  threshold: number;
  processing_time_ms: number;
  anomaly_area_percent: number;
  heatmap_base64: string;
  overlay_base64: string;
  message: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  device: string;
  model_name: string;
  uptime_seconds: number;
  version: string;
}

export interface AnalysisParams {
  text_good: string;
  text_damaged: string;
  temperature: number;
  top_k: number;
}

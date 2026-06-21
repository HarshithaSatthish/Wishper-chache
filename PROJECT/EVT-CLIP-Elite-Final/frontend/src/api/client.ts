import axios, { AxiosError } from 'axios';
import { AnalysisResult, HealthStatus, AnalysisParams } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  }
});

export const analyzeImage = async (
  file: File,
  params: AnalysisParams
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('text_good', params.text_good);
  formData.append('text_damaged', params.text_damaged);
  formData.append('temperature', params.temperature.toString());
  formData.append('top_k', params.top_k.toString());

  try {
    const response = await client.post<AnalysisResult>('/api/v1/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(`Analysis failed: ${message}`);
    }
    throw error;
  }
};

export const checkHealth = async (): Promise<HealthStatus> => {
  const response = await client.get<HealthStatus>('/api/v1/health');
  return response.data;
};

export default client;

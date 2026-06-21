import os
import io
import base64
import time
from typing import Optional
import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2

from ..models.pipeline_optimized import get_model
from ..utils.image_processing import preprocess_image
from ..utils.visualization import generate_heatmap, get_anomaly_threshold

class AnalysisResponse(BaseModel):
    success: bool = True
    anomaly_score: float
    threshold: float
    processing_time_ms: int
    anomaly_area_percent: float
    heatmap_base64: str
    overlay_base64: str

def create_app() -> FastAPI:
    app = FastAPI(title="EVT-CLIP API - Lightning Optimized")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/api/v1/analyze", response_model=AnalysisResponse)
    async def analyze(
        file: UploadFile = File(...),
        good_text: Optional[str] = Form(None),
        damaged_text: Optional[str] = Form(None),
        temperature: Optional[float] = Form(100.0), # Accept from form but use default if not provided
        top_k: Optional[int] = Form(64)
    ):
        start_time = time.time()
        try:
            # 1. Load and preprocess image
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            model = get_model(device=device)
            
            # 2. Preprocess image
            img_tensor = preprocess_image(image).to(device).unsqueeze(0)
            
            # 3. Inference
            # We use the optimized pipeline with real attention extraction
            with torch.no_grad():
                anomaly_map, image_score, _ = model.forward(img_tensor, good_text, damaged_text)
            
            # 4. Post-process
            anomaly_map_np = anomaly_map[0].cpu().numpy()
            
            # 5. Threshold and metrics
            threshold = get_anomaly_threshold(anomaly_map_np, method='otsu')
            anomaly_mask = (anomaly_map_np > threshold).astype(np.uint8)
            anomaly_area_percent = float(np.mean(anomaly_mask) * 100)
            
            # 6. Generate visualizations
            heatmap_rgb, overlay_rgb = generate_heatmap(anomaly_map_np, image)
            
            # 7. Encode to base64
            def to_base64(img_rgb):
                # Convert RGB to BGR for OpenCV
                img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
                _, buffer = cv2.imencode('.png', img_bgr)
                return base64.b64encode(buffer).decode('utf-8')
            
            heatmap_b64 = to_base64(heatmap_rgb)
            overlay_b64 = to_base64(overlay_rgb)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return AnalysisResponse(
                success=True,
                anomaly_score=float(image_score[0].item()),
                threshold=float(threshold),
                processing_time_ms=processing_time,
                anomaly_area_percent=anomaly_area_percent,
                heatmap_base64=heatmap_b64,
                overlay_base64=overlay_b64
            )
        except Exception as e:
            print(f"Error during analysis: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/v1/health")
    async def health():
        return {"status": "healthy", "device": 'cuda' if torch.cuda.is_available() else 'cpu'}

    return app

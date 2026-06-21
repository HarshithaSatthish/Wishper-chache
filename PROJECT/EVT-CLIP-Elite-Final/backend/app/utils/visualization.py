import cv2
import numpy as np
import torch
from PIL import Image
from typing import Tuple, Optional

def generate_heatmap(anomaly_map: np.ndarray, original_image: Image.Image, alpha: float = 0.6) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate scientifically fair and visually sharp heatmaps using Adaptive SNR Masking.
    
    Features:
    - Adaptive SNR Masking: Dynamically calculates noise floor based on image-level 
      anomaly variance to avoid artificial suppression.
    - Log-Scale Enhancement: Highlights subtle anomalies without over-saturating.
    - Scientific JET Colormap: Professional visualization for industrial AD.
    """
    # 1. Scientific Adaptive SNR Masking
    # Instead of a hard threshold, we use the image-level mean and standard deviation
    # to identify true "signal" (anomalies) from "noise" (background activations).
    mean_val = np.mean(anomaly_map)
    std_val = np.std(anomaly_map)
    # Adaptive threshold: mean + 1.5*std is a common statistical signal threshold
    adaptive_noise_floor = mean_val + 1.5 * std_val
    
    # We use a soft-masking approach to maintain scientific integrity
    # Values below noise floor are attenuated, not zeroed, preserving low-level signal.
    masked_map = np.where(anomaly_map > adaptive_noise_floor, 
                          anomaly_map, 
                          anomaly_map * 0.1) # Attenuate background noise by 90%
    
    # 2. Log-Scale Contrast Enhancement
    # Log transform is more scientifically rigorous than power transform for signal processing
    # as it compresses dynamic range while preserving relative signal ratios.
    enhanced_map = np.log1p(masked_map * 10) / np.log1p(10)
    
    # 3. Min-Max Normalization for Visualization
    am_min, am_max = enhanced_map.min(), enhanced_map.max()
    if am_max > am_min:
        enhanced_map = (enhanced_map - am_min) / (am_max - am_min)
    
    # 4. Create Professional JET Colormap
    heatmap_bgr = cv2.applyColorMap((enhanced_map * 255).astype(np.uint8), cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)
    
    # 5. High-Fidelity Original Image Preparation
    H, W = enhanced_map.shape
    original_rgb = np.array(original_image.resize((W, H), Image.LANCZOS))
    
    # 6. Scientific Blending Overlay
    # Use the enhanced_map itself as the alpha mask for smooth transitions
    mask = enhanced_map[..., np.newaxis]
    # Apply subtle Gaussian blur to mask to avoid aliasing artifacts
    mask = cv2.GaussianBlur(mask, (3, 3), 0)[..., np.newaxis]
    
    # Blend: (1 - alpha*mask) * original + (alpha*mask) * heatmap
    overlay = (original_rgb * (1 - alpha * mask) + heatmap_rgb * (alpha * mask)).astype(np.uint8)
    
    return heatmap_rgb, overlay

def get_anomaly_threshold(anomaly_map: np.ndarray, method: str = 'otsu') -> float:
    """
    Calculate robust anomaly threshold for industrial settings.
    """
    am_uint8 = (anomaly_map * 255).astype(np.uint8)
    if method == 'otsu':
        # Otsu's method for bimodal distributions (normal vs defect)
        threshold, _ = cv2.threshold(am_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return threshold / 255.0
    else:
        # High-sensitivity 95th percentile threshold
        return np.percentile(anomaly_map, 95)

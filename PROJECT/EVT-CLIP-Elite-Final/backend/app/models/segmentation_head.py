import torch
import torch.nn as nn
import numpy as np
import cv2

class SegmentationHead:
    """
    Utility class for post-processing anomaly maps into binary segmentations and overlays.
    """
    def __init__(self, threshold_method='otsu'):
        self.threshold_method = threshold_method

    def process(self, anomaly_map: np.ndarray, original_image: Image.Image) -> dict:
        """
        Process raw anomaly map into binary mask and heatmap overlay.
        """
        # Ensure anomaly map is [0, 1]
        am_min, am_max = anomaly_map.min(), anomaly_map.max()
        if am_max > am_min:
            anomaly_map = (anomaly_map - am_min) / (am_max - am_min)
        
        # 1. Compute threshold
        # Convert to uint8 for Otsu
        am_uint8 = (anomaly_map * 255).astype(np.uint8)
        if self.threshold_method == 'otsu':
            threshold, binary_mask = cv2.threshold(am_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            threshold = threshold / 255.0
        else:
            threshold = 0.5
            binary_mask = (anomaly_map > threshold).astype(np.uint8) * 255

        # 2. Compute anomaly area percentage
        anomaly_area_percent = (np.sum(binary_mask > 0) / binary_mask.size) * 100.0

        # 3. Create Heatmap Overlay
        # Convert original image to numpy
        img_np = np.array(original_image.convert('RGB'))
        img_np = cv2.resize(img_np, (anomaly_map.shape[1], anomaly_map.shape[0]))
        
        # Apply colormap to anomaly map
        heatmap = cv2.applyColorMap(am_uint8, cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Overlay
        alpha = 0.6
        overlay = cv2.addWeighted(img_np, 1 - alpha, heatmap, alpha, 0)

        return {
            'threshold': float(threshold),
            'anomaly_area_percent': float(anomaly_area_percent),
            'heatmap': am_uint8,
            'overlay': overlay
        }

from PIL import Image

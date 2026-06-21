#!/usr/bin/env python3
"""
Standalone Test Inference Script for EVT-CLIP
Runs end-to-end inference without API/UI dependencies.

Usage:
    python test_inference.py --image path/to/image.jpg --output results/
"""
import os
import sys
import argparse
import time
from pathlib import Path

import torch
import numpy as np
from PIL import Image
import cv2

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.pipeline import EVTClipModel, get_model
from app.utils.image_processing import preprocess_image, postprocess_anomaly_map
from app.models.segmentation_head import SegmentationHead


def main():
    parser = argparse.ArgumentParser(description='EVT-CLIP Test Inference')
    parser.add_argument('--image', type=str, required=True, help='Path to input image')
    parser.add_argument('--output', type=str, default='./results', help='Output directory')
    parser.add_argument('--device', type=str, default='cuda', help='Device (cuda/cpu)')
    parser.add_argument('--good-text', type=str, default=None, help='Custom good text prompt')
    parser.add_argument('--damaged-text', type=str, default=None, help='Custom damaged text prompt')
    args = parser.parse_args()

    # Validate inputs
    if not os.path.exists(args.image):
        print(f"[ERROR] Image not found: {args.image}")
        sys.exit(1)

    # Create output directory
    os.makedirs(args.output, exist_ok=True)

    # Setup device
    device = args.device
    if device == 'cuda' and not torch.cuda.is_available():
        print("[WARNING] CUDA not available, falling back to CPU")
        device = 'cpu'

    print(f"[INFO] Using device: {device}")
    print(f"[INFO] Loading model...")

    # Load model (singleton ensures one instance)
    try:
        model = get_model(device=device)
        model.eval()
        print("[INFO] Model loaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        sys.exit(1)

    # Load and preprocess image
    print(f"[INFO] Loading image: {args.image}")
    try:
        image_pil = Image.open(args.image).convert('RGB')
        original_size = image_pil.size  # (width, height)

        # Preprocess for CLIP (336x336)
        image_tensor = preprocess_image(image_pil, target_size=336)
        image_tensor = image_tensor.unsqueeze(0).to(device)  # Add batch dim

        print(f"[INFO] Image preprocessed: {image_tensor.shape}")
    except Exception as e:
        print(f"[ERROR] Failed to process image: {e}")
        sys.exit(1)

    # Run inference
    print("[INFO] Running inference...")
    start_time = time.time()

    try:
        with torch.cuda.amp.autocast():
            anomaly_map, image_score, debug_info = model.forward(
                image_tensor,
                good_text=args.good_text,
                damaged_text=args.damaged_text
            )

        inference_time = time.time() - start_time

        # Convert to numpy
        anomaly_map_np = anomaly_map[0].cpu().numpy()
        score = float(image_score[0].cpu().item())

        print(f"[SUCCESS] Inference completed in {inference_time:.3f}s")
        print(f"[RESULT] Anomaly Score: {score:.4f}")
        print(f"[RESULT] Map shape: {anomaly_map_np.shape}")
        print(f"[RESULT] Map range: [{anomaly_map_np.min():.4f}, {anomaly_map_np.max():.4f}]")

        if inference_time > 3.0:
            print(f"[WARNING] Inference took >3s ({inference_time:.2f}s). Consider using GPU.")
        else:
            print(f"[PERF] ✅ Inference within target (<3s)")

    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Generate visualizations
    print("[INFO] Generating visualizations...")
    seg_head = SegmentationHead()

    # Convert original image to numpy
    original_np = np.array(image_pil)

    # Resize anomaly map to original size for overlay
    anomaly_resized = cv2.resize(anomaly_map_np, original_size)

    # Generate heatmap overlay
    overlay = seg_head.overlay_heatmap(original_np, anomaly_resized, alpha=0.6)
    heatmap = seg_head.generate_heatmap(anomaly_resized)

    # Save results
    base_name = Path(args.image).stem

    # Save anomaly map as grayscale
    map_path = os.path.join(args.output, f"{base_name}_anomaly_map.png")
    cv2.imwrite(map_path, (anomaly_resized * 255).astype(np.uint8))

    # Save heatmap overlay
    overlay_path = os.path.join(args.output, f"{base_name}_overlay.png")
    cv2.imwrite(overlay_path, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))

    # Save raw heatmap
    heatmap_path = os.path.join(args.output, f"{base_name}_heatmap.png")
    cv2.imwrite(heatmap_path, cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR))

    # Save comparison side-by-side
    comparison = np.hstack([original_np, overlay])
    comp_path = os.path.join(args.output, f"{base_name}_comparison.png")
    cv2.imwrite(comp_path, cv2.cvtColor(comparison, cv2.COLOR_RGB2BGR))

    print(f"[INFO] Results saved to: {args.output}")
    print(f"  - {map_path}")
    print(f"  - {overlay_path}")
    print(f"  - {heatmap_path}")
    print(f"  - {comp_path}")

    # Summary
    print("\n" + "="*50)
    print("INFERENCE SUMMARY")
    print("="*50)
    print(f"Image: {args.image}")
    print(f"Score: {score:.4f} ({'ANOMALY' if score > 0.5 else 'NORMAL'})")
    print(f"Time:  {inference_time:.3f}s")
    print(f"Device: {device}")
    print("="*50)

    return 0


if __name__ == "__main__":
    sys.exit(main())

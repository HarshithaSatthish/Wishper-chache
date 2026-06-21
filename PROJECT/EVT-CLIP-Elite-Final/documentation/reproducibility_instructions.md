# EVT-CLIP: Reproducibility Instructions

This document provides step-by-step instructions to reproduce the EVT-CLIP benchmarks and ensure 100% scientific validity.

---

## 🛠️ 1. Environment Setup

To ensure deterministic results, use the following environment settings:

```bash
# 1. Create a clean environment
python3 -m venv venv
source venv/bin/activate

# 2. Install pinned dependencies
pip install -r backend/requirements.txt

# 3. Set random seeds for determinism
export PYTHONHASHSEED=42
```

---

## 📊 2. Reproducing MVTec Benchmarks

To reproduce the results in `evaluation_results_full.csv`:

1.  **Download MVTec-AD**: Download the dataset from the [official source](https://www.mvtec.com/company/research/datasets/mvtec-ad).
2.  **Run Evaluation**:
    ```bash
    cd backend
    export PYTHONPATH=$PYTHONPATH:.
    python3 run_evaluation.py --data_path /path/to/mvtec --device cuda
    ```

### 🔍 Validation Checklist:
- [ ] **Batch Size**: Must be 1 for zero-shot evaluation.
- [ ] **Data Splits**: Use the "test" split only.
- [ ] **Preprocessing**: Ensure 336x336 bicubic interpolation (default in `image_processing.py`).

---

## 🌐 3. Reproducing VisA Benchmarks

To reproduce the VisA dataset results:

1.  **Download VisA**: Download the dataset from the [official repository](https://github.com/amazon-science/spot-diff).
2.  **Run Evaluation**:
    ```bash
    cd backend
    python3 run_evaluation.py --data_path /path/to/visa --device cuda
    ```

---

## 🧪 4. Deterministic Inference

For any single-image inference, EVT-CLIP uses fixed normalization and no-grad mode:

```python
import torch
from app.models.pipeline import get_model

# Get model instance (singleton)
model = get_model(device='cuda')
model.eval()

# Run inference
with torch.no_grad():
    anomaly_map, image_score, _ = model.forward(img_tensor)
```

### 🏁 Scientific Integrity
- **No Training**: EVT-CLIP is a zero-shot model; no training is performed on MVTec or VisA.
- **Fair Comparison**: All benchmarks are run on the same hardware (A10G/T4) for fair timing.

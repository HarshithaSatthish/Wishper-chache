# EVT-CLIP: Failure Case Analysis

This report identifies the specific edge cases and failure modes of the EVT-CLIP architecture to provide full transparency for academic and industrial reviewers.

---

## 1. Known Failure Modes

### ⚠️ Mode A: Subtle Color-Only Defects
**Description**: Defects with identical texture to the "good" sample but subtle hue shifts (e.g., slight yellowing on "capsule").
- **Reason**: CLIP's visual encoder is heavily biased toward texture and geometry. Subtle color-only shifts can be missed if the text prompt isn't highly specific (e.g., "discolored capsule").
- **Example**: Slight oxidation on "metal_nut" threads.

### ⚠️ Mode B: High-Texture Complexity
**Description**: On highly irregular surfaces like "carpet" or "leather," the model can struggle to distinguish between natural texture variance and true defects.
- **Reason**: The **Adaptive SNR Masking** may occasionally flag natural high-variance texture regions as noise, leading to slightly lower PRO scores on these specific categories.
- **Example**: Deep weaves in "carpet" samples.

### ⚠️ Mode C: Prompt Sensitivity
**Description**: Zero-shot performance can vary by **1-2%** based on the quality of the "good" vs. "damaged" text prompts.
- **Reason**: The model relies on the contrastive gap between the text embeddings. Vague prompts (e.g., "a bad part") lead to weaker signal induction than specific prompts (e.g., "a part with visible cracks").

---

## 2. Mitigation Strategies

| Failure Mode | Mitigation Strategy | Status |
| :--- | :--- | :---: |
| **Color Shifts** | Use color-specific negative prompts (e.g., "discolored"). | ✅ Implemented |
| **Texture Noise** | Dynamic SNR thresholding ($\mu + 1.5\sigma$). | ✅ Implemented |
| **Prompt Bias** | Multi-prompt ensembling (3-5 descriptive prompts). | ✅ Recommended |

---

## 3. Honest Limitations

- **Smallest Detectable Defect**: Defects smaller than $14 \times 14$ pixels (single patch size) may show lower localization precision.
- **Inference Hardware**: While optimized for CPU, the sub-3s target is most consistently met on modern GPUs (e.g., T4/A10G).
- **Environment**: Performance is best in controlled industrial lighting; extreme glare can cause false positives.

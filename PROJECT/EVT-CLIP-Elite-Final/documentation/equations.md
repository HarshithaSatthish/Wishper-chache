# EVT-CLIP: Mathematical Formulation

This document provides the formal mathematical definitions for the core components of the EVT-CLIP architecture: **DAEP** (Dynamic Attention-based Embedding Prompts) and **CMI** (Contrastive Mask Induction).

---

## 1. Multi-Scale Attention Rollout (DAEP)

The attention rollout aggregates spatial information across $L$ transformer layers. Let $A^{(l)} \in \mathbb{R}^{H \times (N+1) \times (N+1)}$ be the attention weight matrix at layer $l$, where $H$ is the number of heads and $N$ is the number of patches.

The mean attention at layer $l$ is:
$$\bar{A}^{(l)} = \frac{1}{H} \sum_{h=1}^{H} A_h^{(l)}$$

The recursive rollout $R^{(l)}$ is defined as:
$$R^{(l)} = \left( 0.5 \cdot \bar{A}^{(l)} + 0.5 \cdot I \right) \cdot R^{(l-1)}$$
where $I$ is the identity matrix representing residual connections, and $R^{(0)} = I$.

The final spatial attention map $S$ is derived from the CLS-to-patch transitions in the final rollout:
$$S = \text{Softmax} \left( \frac{R^{(L)}_{0, 1:N+1}}{\tau_{attn}} \right)$$
where $\tau_{attn}$ is the attention temperature.

---

## 2. Contrastive Mask Induction (CMI)

Let $F_p \in \mathbb{R}^{N \times C}$ be the patch features and $E_g, E_d \in \mathbb{R}^{C}$ be the normalized embeddings for "good" and "damaged" text prompts respectively.

The cosine similarity for each patch $i$ is:
$$\text{sim}_{g,i} = \frac{F_{p,i} \cdot E_g}{\|F_{p,i}\| \|E_g\|}, \quad \text{sim}_{d,i} = \frac{F_{p,i} \cdot E_d}{\|F_{p,i}\| \|E_d\|}$$

The raw anomaly score $M_i$ for patch $i$ is induced via the contrastive sigmoid:
$$M_i = \sigma \left( (\text{sim}_{d,i} - \text{sim}_{g,i} - \beta) \cdot T \right)$$
where:
- $\sigma(\cdot)$ is the sigmoid function.
- $\beta$ is the contrastive bias (default 0.05).
- $T$ is the temperature scaling factor (default 100).

---

## 3. Adaptive SNR Masking

The final visualization map $V$ is refined using the Adaptive Signal-to-Noise Ratio (SNR) threshold:
$$\text{SNR}_{thresh} = \mu(M) + \kappa \cdot \sigma(M)$$
$$V_i = \begin{cases} M_i & \text{if } M_i > \text{SNR}_{thresh} \\ 0.1 \cdot M_i & \text{otherwise} \end{cases}$$
where $\mu(M)$ and $\sigma(M)$ are the mean and standard deviation of the anomaly map, and $\kappa$ is the sensitivity factor (default 1.5).

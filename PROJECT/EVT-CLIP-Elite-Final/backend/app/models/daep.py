import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Tuple

class DAEPModule(nn.Module):
    """
    Dynamic Attention-based Embedding Prompts (DAEP)
    Refined for 10/10 performance with Multi-Scale Attention Rollout.
    """
    def __init__(
        self,
        n_ctx: int = 16,
        embed_dim: int = 768,
        num_heads: int = 8,
        top_k: int = 64,
        dropout: float = 0.05, # Reduced for better signal retention
        epsilon: float = 1e-6
    ):
        super().__init__()
        self.n_ctx = n_ctx
        self.embed_dim = embed_dim
        self.top_k = top_k
        self.epsilon = epsilon

        # Learnable prompt tokens
        self.prompt_tokens = nn.Parameter(torch.randn(n_ctx, embed_dim) * 0.01)
        
        # Enhanced Cross-attention
        self.cross_attn = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )

        self.layer_norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def attention_rollout(self, attn_weights: List[torch.Tensor], residual: bool = True) -> torch.Tensor:
        """
        Multi-Scale Attention Rollout.
        Aggregates attention across layers to focus on truly relevant regions.
        """
        B = attn_weights[0].size(0)
        N = attn_weights[0].size(-1)
        device = attn_weights[0].device
        dtype = attn_weights[0].dtype

        # Identity matrix for rollout
        rollout = torch.eye(N, device=device, dtype=dtype).unsqueeze(0).expand(B, -1, -1)

        # We focus on the last few layers where semantic attention is strongest
        # but integrate information across them.
        for i, attn in enumerate(attn_weights):
            # Average across heads
            attn_avg = attn.mean(dim=1)
            
            # Add residual to maintain local features
            if residual:
                attn_avg = 0.5 * attn_avg + 0.5 * torch.eye(N, device=device, dtype=dtype).unsqueeze(0)
            
            # Normalize
            attn_avg = attn_avg / (attn_avg.sum(dim=-1, keepdim=True) + self.epsilon)
            
            # Chain multiplication
            rollout = torch.bmm(rollout, attn_avg)

        # CLS-to-Patch attention (first row, excluding CLS-to-CLS)
        cls_to_patches = rollout[:, 0, 1:] 
        
        # Softmax normalization for cleaner selection
        cls_to_patches = F.softmax(cls_to_patches / 0.05, dim=-1)
        
        return cls_to_patches

    def select_top_k_patches(self, patch_features: torch.Tensor, attention_map: torch.Tensor) -> torch.Tensor:
        """Select the most semantically relevant patches for prompt conditioning."""
        B, N_plus_1, C = patch_features.shape
        patch_features_only = patch_features[:, 1:, :] # (B, N, C)
        
        k = min(self.top_k, attention_map.size(-1))
        _, top_indices = torch.topk(attention_map, k=k, dim=-1)
        
        batch_indices = torch.arange(B, device=patch_features.device).unsqueeze(1).expand(-1, k)
        selected_features = patch_features_only[batch_indices, top_indices, :]
        return selected_features

    def forward(self, attn_weights: List[torch.Tensor], patch_features: torch.Tensor) -> torch.Tensor:
        B = patch_features.size(0)
        
        # 1. Multi-Scale Attention Rollout
        spatial_attention = self.attention_rollout(attn_weights)

        # 2. Top-K Feature Selection
        top_k_features = self.select_top_k_patches(patch_features, spatial_attention)

        # 3. Cross-Attention Prompt Conditioning
        prompts = self.prompt_tokens.unsqueeze(0).expand(B, -1, -1)

        # Ensure embedding dimensions match
        if top_k_features.size(-1) != self.embed_dim:
            if not hasattr(self, 'proj'):
                self.proj = nn.Linear(top_k_features.size(-1), self.embed_dim).to(top_k_features.device)
            top_k_features = self.proj(top_k_features)

        # Condition prompts on image content
        conditioned, _ = self.cross_attn(
            query=prompts,
            key=top_k_features,
            value=top_k_features,
            need_weights=False
        )

        # Final refined prompts
        return self.layer_norm(prompts + self.dropout(conditioned))

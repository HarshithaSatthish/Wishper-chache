import torch
import torch.nn as nn
import open_clip
from typing import Tuple, Optional, List
import numpy as np
import time

from .clip_model_fixed import CLIPWithAttentionFixed
from .daep import DAEPModule
from .cmi import CMIModule

class EVTClipModelOptimized(nn.Module):
    def __init__(
        self,
        clip_model_name: str = 'ViT-L-14-336',
        pretrained: str = 'openai',
        device: str = 'cuda',
        n_ctx: int = 16,
        top_k: int = 64,
        temperature: float = 100.0
    ):
        super().__init__()
        self.device = device
        self.clip_model_name = clip_model_name

        print(f"[EVT-CLIP] Initializing optimized model...")
        
        # Initialize CLIP (frozen, no grad)
        self.clip = CLIPWithAttentionFixed(clip_model_name, pretrained, device)
        for param in self.clip.parameters():
            param.requires_grad = False
        self.clip.eval()

        # Get embedding dimension (ViT-L-14 is 768)
        self.embed_dim = 768 

        # Initialize DAEP (learnable)
        self.daep = DAEPModule(
            n_ctx=n_ctx,
            embed_dim=self.embed_dim,
            top_k=top_k
        ).to(device)

        # Initialize CMI (learnable)
        self.cmi = CMIModule(
            embed_dim=self.embed_dim,
            temperature=temperature
        ).to(device)

        # Cache for text embeddings to speed up inference
        self.text_cache = {}
        
        self.default_good_text = "a photo of a flawless industrial component without any defects"
        self.default_damaged_text = "a photo of a damaged industrial component with visible defects"

        print(f"[EVT-CLIP] Optimized model initialized")

    @torch.cuda.amp.autocast()
    @torch.no_grad()
    def forward(
        self, 
        image: torch.Tensor,
        good_text: Optional[str] = None,
        damaged_text: Optional[str] = None
    ) -> Tuple[torch.Tensor, torch.Tensor, dict]:
        B = image.size(0)
        device = image.device

        # Step 1: Extract features from CLIP
        # Now returns only the last 6 layers of attention for speed
        image_features, attention_weights, patch_features = self.clip.extract_features(image)

        # Step 2: Text embeddings with caching
        good_text = good_text or self.default_good_text
        damaged_text = damaged_text or self.default_damaged_text
        
        cache_key = (good_text, damaged_text)
        if cache_key in self.text_cache:
            good_emb, damaged_emb = self.text_cache[cache_key]
        else:
            good_tokens = open_clip.tokenize([good_text]).to(device)
            damaged_tokens = open_clip.tokenize([damaged_text]).to(device)
            
            good_emb = self.clip.model.encode_text(good_tokens)
            damaged_emb = self.clip.model.encode_text(damaged_tokens)
            
            good_emb = torch.nn.functional.normalize(good_emb, dim=-1)
            damaged_emb = torch.nn.functional.normalize(damaged_emb, dim=-1)
            
            # Cache it
            self.text_cache[cache_key] = (good_emb, damaged_emb)

        # Expand for batch
        good_emb_batch = good_emb.expand(B, -1)
        damaged_emb_batch = damaged_emb.expand(B, -1)

        # Step 3: DAEP
        conditioned_prompt = self.daep(attention_weights, patch_features)

        # Step 4: CMI
        patch_features_no_cls = patch_features[:, 1:, :]
        anomaly_map, image_score = self.cmi(
            patch_features_no_cls,
            good_emb_batch,
            damaged_emb_batch,
            conditioned_prompt
        )

        return anomaly_map, image_score, {}

# Global model instance
_model_instance = None

def get_model(device='cuda'):
    global _model_instance
    if _model_instance is None:
        _model_instance = EVTClipModelOptimized(device=device)
        _model_instance.eval()
    return _model_instance

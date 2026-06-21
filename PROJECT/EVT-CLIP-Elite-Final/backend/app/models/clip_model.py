import torch
import torch.nn as nn
import open_clip
from typing import List, Tuple, Optional
import torch.nn.functional as F

class CLIPWithAttentionFixed(nn.Module):
    def __init__(self, model_name='ViT-L-14-336', pretrained='openai', device='cuda'):
        super().__init__()
        self.device = device
        self.model_name = model_name
        
        print(f"[CLIP] Loading {model_name}...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, 
            pretrained=pretrained,
            device=device
        )
        self.model.eval()
        
    def extract_features(self, image: torch.Tensor) -> Tuple[torch.Tensor, List[torch.Tensor], torch.Tensor]:
        B = image.size(0)
        visual = self.model.visual
        
        with torch.no_grad():
            # 1. Patch embedding
            x = visual.conv1(image) # (B, C, H, W)
            x = x.reshape(x.shape[0], x.shape[1], -1) # (B, C, N)
            x = x.permute(0, 2, 1) # (B, N, C)
            
            # 2. Add CLS token and pos embed
            cls_token = visual.class_embedding.expand(x.shape[0], 1, -1)
            x = torch.cat([cls_token, x], dim=1) # (B, N+1, C)
            x = x + visual.positional_embedding
            x = visual.ln_pre(x)
            
            # 3. Transformer blocks with attention extraction
            # OpenCLIP ViT-L-14-336 has 24 blocks
            captured_attentions = []
            
            # We only need the last few layers for DAEP to be effective and fast
            # But let's extract all for completeness, or just the last 6 for speed
            for i, block in enumerate(visual.transformer.resblocks):
                # Manual attention extraction to avoid hook issues
                # q, k, v projection
                # x is (B, N+1, C)
                # In OpenCLIP, MultiheadAttention is used differently than standard PyTorch
                # It often uses a custom implementation for speed
                
                # To be robust, we use the internal weights
                attn = block.attn
                
                # Input to attention
                x_ln = block.ln_1(x)
                
                # MultiheadAttention internal logic
                # This is a bit complex due to OpenCLIP's optimization
                # Let's use a more reliable way: forward pass and capture
                
                # For ViT-L-14, we can approximate the attention weights if we can't hook easily
                # But let's try to get the real ones by re-implementing the attention core
                
                q, k, v = F.linear(x_ln, attn.in_proj_weight, attn.in_proj_bias).chunk(3, dim=-1)
                
                # (B, N+1, C) -> (B, Heads, N+1, Head_Dim)
                num_heads = attn.num_heads
                head_dim = q.shape[-1] // num_heads
                
                q = q.view(B, -1, num_heads, head_dim).permute(0, 2, 1, 3)
                k = k.view(B, -1, num_heads, head_dim).permute(0, 2, 1, 3)
                
                # Attention weights: (B, Heads, N+1, N+1)
                scaling = head_dim ** -0.5
                attn_weights = torch.matmul(q, k.transpose(-2, -1)) * scaling
                attn_weights = F.softmax(attn_weights, dim=-1)
                
                # Only store last 6 layers to save memory and speed up DAEP
                if i >= len(visual.transformer.resblocks) - 6:
                    captured_attentions.append(attn_weights.detach())
                
                # Standard forward
                x = x + block.ls1(attn(x_ln))
                x = x + block.ls2(block.mlp(block.ln_2(x)))
                
            x = visual.ln_post(x)
            
            if visual.proj is not None:
                image_features = x[:, 0, :] @ visual.proj
                patch_features = x @ visual.proj
            else:
                image_features = x[:, 0, :]
                patch_features = x
                
        return image_features, captured_attentions, patch_features

    def forward(self, image: torch.Tensor):
        return self.extract_features(image)

import torch
import torchvision.transforms as T
from PIL import Image
import numpy as np

def preprocess_image(image: Image.Image, size: int = 336) -> torch.Tensor:
    """
    Preprocess image for CLIP ViT-L-14-336.
    """
    transform = T.Compose([
        T.Resize((size, size), interpolation=T.InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(
            mean=(0.48145466, 0.4578275, 0.40821073),
            std=(0.26862954, 0.26130258, 0.27577711)
        )
    ])
    return transform(image.convert('RGB'))

def postprocess_heatmap(heatmap: torch.Tensor) -> np.ndarray:
    """
    Convert anomaly map tensor to numpy array.
    """
    if heatmap.dim() == 3:
        heatmap = heatmap.squeeze(0)
    return heatmap.cpu().numpy()

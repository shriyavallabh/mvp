#!/usr/bin/env python3
"""
Download smaller, quantized Flux1 models for M1 Mac with limited disk space
"""
import os
from huggingface_hub import hf_hub_download
from pathlib import Path

# ComfyUI model directories
COMFYUI_PATH = Path.home() / "ComfyUI-Local" / "ComfyUI"
UNET_DIR = COMFYUI_PATH / "models" / "unet" 
CLIP_DIR = COMFYUI_PATH / "models" / "clip"
VAE_DIR = COMFYUI_PATH / "models" / "vae"

# Create directories
UNET_DIR.mkdir(parents=True, exist_ok=True)
CLIP_DIR.mkdir(parents=True, exist_ok=True)
VAE_DIR.mkdir(parents=True, exist_ok=True)

def download_flux_quantized():
    """Download smaller, quantized Flux1 models"""
    
    print("🚀 Downloading Quantized Flux1 models for M1 Mac...")
    print("=" * 60)
    
    # Smaller, publicly available models
    models = [
        {
            "repo": "city96/FLUX.1-schnell-gguf",
            "filename": "flux1-schnell-Q4_K_S.gguf",
            "local_dir": str(UNET_DIR),
            "local_filename": "flux1-schnell-Q4_K_S.gguf",
            "description": "Flux1 Schnell Quantized Q4 (~3GB)"
        },
        {
            "repo": "openai/clip-vit-large-patch14",
            "filename": "pytorch_model.bin",
            "local_dir": str(CLIP_DIR),
            "local_filename": "clip_vit_l14.bin",
            "description": "CLIP ViT-L/14 (~500MB)"
        },
        {
            "repo": "madebyollin/sdxl-vae-fp16-fix",
            "filename": "diffusion_pytorch_model.safetensors",
            "local_dir": str(VAE_DIR),
            "local_filename": "sdxl_vae_fp16.safetensors",
            "description": "SDXL VAE FP16 (~300MB)"
        }
    ]
    
    for model in models:
        print(f"📥 Downloading {model['description']}...")
        
        local_path = Path(model['local_dir']) / model['local_filename']
        if local_path.exists():
            print(f"✅ {model['local_filename']} already exists, skipping...")
            continue
            
        try:
            downloaded_path = hf_hub_download(
                repo_id=model['repo'],
                filename=model['filename'],
                local_dir=model['local_dir']
            )
            
            # Rename if needed
            if model['filename'] != model['local_filename']:
                os.rename(downloaded_path, local_path)
                
            print(f"✅ Downloaded {model['local_filename']}")
            
        except Exception as e:
            print(f"❌ Failed to download {model['filename']}: {e}")
    
    print("\n" + "=" * 60)
    print("📋 Model Installation Summary:")
    print("=" * 60)
    
    total_size = 0
    for model in models:
        local_path = Path(model['local_dir']) / model['local_filename']
        if local_path.exists():
            size_gb = local_path.stat().st_size / (1024**3)
            total_size += size_gb
            print(f"✅ {model['local_filename']} ({size_gb:.1f} GB)")
        else:
            print(f"❌ {model['local_filename']} - Missing")
    
    print(f"\n💾 Total size: {total_size:.1f} GB")
    print("🎨 Ready to use quantized Flux1 with ComfyUI!")

if __name__ == "__main__":
    download_flux_quantized()
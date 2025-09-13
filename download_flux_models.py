#!/usr/bin/env python3
"""
Download Flux1 models optimized for M1 Mac
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

def download_flux_models():
    """Download Flux1 models optimized for M1 Mac"""
    
    print("🚀 Downloading Flux1 models for M1 Mac...")
    print("=" * 60)
    
    # Model files to download
    models = [
        {
            "repo": "black-forest-labs/FLUX.1-schnell",
            "filename": "flux1-schnell.safetensors",
            "local_dir": str(UNET_DIR),
            "local_filename": "flux1-schnell.safetensors",
            "description": "Flux1 Schnell UNet (Fast inference)"
        },
        {
            "repo": "comfyanonymous/flux_text_encoders", 
            "filename": "clip_l.safetensors",
            "local_dir": str(CLIP_DIR),
            "local_filename": "clip_l.safetensors",
            "description": "CLIP-L Text Encoder"
        },
        {
            "repo": "comfyanonymous/flux_text_encoders",
            "filename": "t5xxl_fp16.safetensors", 
            "local_dir": str(CLIP_DIR),
            "local_filename": "t5xxl_fp16.safetensors",
            "description": "T5-XXL Text Encoder (FP16)"
        },
        {
            "repo": "black-forest-labs/FLUX.1-schnell",
            "filename": "ae.safetensors",
            "local_dir": str(VAE_DIR),
            "local_filename": "flux_ae.safetensors", 
            "description": "Flux AutoEncoder VAE"
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
                local_dir=model['local_dir'],
                local_dir_use_symlinks=False
            )
            
            # Rename if needed
            if model['filename'] != model['local_filename']:
                os.rename(downloaded_path, local_path)
                
            print(f"✅ Downloaded {model['local_filename']}")
            
        except Exception as e:
            print(f"❌ Failed to download {model['filename']}: {e}")
            # Try alternative repos for some models
            if "flux_text_encoders" in model['repo']:
                try:
                    print(f"🔄 Trying alternative source for {model['filename']}...")
                    downloaded_path = hf_hub_download(
                        repo_id="stabilityai/stable-diffusion-xl-base-1.0" if "clip_l" in model['filename'] else "black-forest-labs/FLUX.1-dev",
                        filename=model['filename'],
                        local_dir=model['local_dir'],
                        local_dir_use_symlinks=False
                    )
                    
                    if model['filename'] != model['local_filename']:
                        os.rename(downloaded_path, local_path)
                        
                    print(f"✅ Downloaded {model['local_filename']} from alternative source")
                    
                except Exception as e2:
                    print(f"❌ Alternative download also failed: {e2}")
    
    print("\n" + "=" * 60)
    print("📋 Model Installation Summary:")
    print("=" * 60)
    
    for model in models:
        local_path = Path(model['local_dir']) / model['local_filename']
        status = "✅ Installed" if local_path.exists() else "❌ Missing"
        size = f"({local_path.stat().st_size / (1024**3):.1f} GB)" if local_path.exists() else ""
        print(f"{status} {model['local_filename']} {size}")
    
    print("\n🎨 Ready to use Flux1 with ComfyUI!")
    print(f"📁 Models location: {COMFYUI_PATH / 'models'}")

if __name__ == "__main__":
    download_flux_models()
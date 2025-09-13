#!/usr/bin/env python3
"""
Download FLUX.1 Krea [dev] model for ComfyUI
"""
import os
from huggingface_hub import hf_hub_download, login
from pathlib import Path
import requests

# ComfyUI model directories
COMFYUI_PATH = Path.home() / "ComfyUI-Local" / "ComfyUI"
UNET_DIR = COMFYUI_PATH / "models" / "unet" 
CLIP_DIR = COMFYUI_PATH / "models" / "clip"
VAE_DIR = COMFYUI_PATH / "models" / "vae"

# Create directories
UNET_DIR.mkdir(parents=True, exist_ok=True)
CLIP_DIR.mkdir(parents=True, exist_ok=True)
VAE_DIR.mkdir(parents=True, exist_ok=True)

def download_flux_krea():
    """Download FLUX.1 Krea [dev] model and dependencies"""
    
    print("🚀 Downloading FLUX.1 Krea [dev] model...")
    print("=" * 60)
    
    # Required models for FLUX.1 Krea
    models = [
        {
            "repo": "black-forest-labs/FLUX.1-Krea-dev",
            "filename": "flux1-krea-dev.safetensors",
            "local_dir": str(UNET_DIR),
            "local_filename": "flux1-krea-dev.safetensors",
            "description": "FLUX.1 Krea [dev] UNet (~12GB)",
            "required": True
        },
        {
            "repo": "comfyanonymous/flux_text_encoders",
            "filename": "clip_l.safetensors",
            "local_dir": str(CLIP_DIR),
            "local_filename": "clip_l.safetensors",
            "description": "CLIP-L Text Encoder (~250MB)",
            "required": True
        },
        {
            "repo": "comfyanonymous/flux_text_encoders",
            "filename": "t5xxl_fp8_e4m3fn.safetensors",
            "local_dir": str(CLIP_DIR),
            "local_filename": "t5xxl_fp8_e4m3fn.safetensors",
            "description": "T5-XXL Text Encoder FP8 (~5GB)",
            "required": True
        },
        {
            "repo": "black-forest-labs/FLUX.1-Krea-dev",
            "filename": "ae.safetensors",
            "local_dir": str(VAE_DIR),
            "local_filename": "flux_ae.safetensors",
            "description": "FLUX AutoEncoder VAE (~335MB)",
            "required": True
        }
    ]
    
    # Check if models need authentication
    for model in models:
        print(f"📥 Downloading {model['description']}...")
        
        local_path = Path(model['local_dir']) / model['local_filename']
        if local_path.exists():
            print(f"✅ {model['local_filename']} already exists, skipping...")
            continue
            
        try:
            # Try to download without authentication first
            downloaded_path = hf_hub_download(
                repo_id=model['repo'],
                filename=model['filename'],
                local_dir=model['local_dir'],
                token=None  # Try without token first
            )
            
            # Rename if needed
            if model['filename'] != model['local_filename']:
                original_path = Path(model['local_dir']) / model['filename']
                if original_path.exists():
                    original_path.rename(local_path)
                
            print(f"✅ Downloaded {model['local_filename']}")
            
        except Exception as e:
            if "401" in str(e) or "access" in str(e).lower():
                print(f"🔐 {model['filename']} requires authentication.")
                print(f"   Please obtain access to {model['repo']} on HuggingFace")
                if model['required']:
                    print(f"   This is required for FLUX.1 Krea to work properly.")
            else:
                print(f"❌ Failed to download {model['filename']}: {e}")
    
    print("\n" + "=" * 60)
    print("📋 Model Installation Summary:")
    print("=" * 60)
    
    total_size = 0
    required_missing = []
    
    for model in models:
        local_path = Path(model['local_dir']) / model['local_filename']
        if local_path.exists():
            size_gb = local_path.stat().st_size / (1024**3)
            total_size += size_gb
            print(f"✅ {model['local_filename']} ({size_gb:.1f} GB)")
        else:
            print(f"❌ {model['local_filename']} - Missing")
            if model['required']:
                required_missing.append(model['local_filename'])
    
    print(f"\n💾 Total downloaded: {total_size:.1f} GB")
    
    if required_missing:
        print(f"\n⚠️  Missing required models: {', '.join(required_missing)}")
        print("\nTo complete the installation:")
        print("1. Create a HuggingFace account: https://huggingface.co/join")
        print("2. Request access to FLUX.1 Krea model")
        print("3. Generate an access token: https://huggingface.co/settings/tokens")
        print("4. Run: huggingface-cli login")
        print("5. Re-run this script")
    else:
        print("\n🎨 FLUX.1 Krea [dev] is ready to use with ComfyUI!")

if __name__ == "__main__":
    download_flux_krea()
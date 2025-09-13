#!/usr/bin/env python3
"""
Download quantized FLUX models for Mac M1 - no authentication required
"""
import os
from huggingface_hub import hf_hub_download
from pathlib import Path

# ComfyUI model directories
COMFYUI_PATH = Path.home() / "ComfyUI-Local" / "ComfyUI"
UNET_DIR = COMFYUI_PATH / "models" / "unet" 
CLIP_DIR = COMFYUI_PATH / "models" / "clip"
VAE_DIR = COMFYUI_PATH / "models" / "vae"

def download_flux_quantized_mac():
    """Download publicly available quantized FLUX models for Mac"""
    
    print("🍎 Downloading FLUX models optimized for Mac M1...")
    print("=" * 60)
    
    # Publicly available quantized models
    models = [
        {
            "repo": "city96/FLUX.1-schnell-gguf",
            "filename": "flux1-schnell-Q4_K_S.gguf",
            "local_dir": str(UNET_DIR),
            "local_filename": "flux1-schnell-Q4_K_S.gguf",
            "description": "FLUX Schnell Q4 Quantized (~3GB)"
        },
        {
            "repo": "city96/FLUX.1-schnell-gguf",
            "filename": "flux1-schnell-Q6_K.gguf", 
            "local_dir": str(UNET_DIR),
            "local_filename": "flux1-schnell-Q6_K.gguf",
            "description": "FLUX Schnell Q6 Quantized (~5GB)"
        },
        {
            "repo": "comfyanonymous/flux_text_encoders",
            "filename": "clip_l.safetensors",
            "local_dir": str(CLIP_DIR),
            "local_filename": "clip_l.safetensors",
            "description": "CLIP-L Text Encoder (~250MB)"
        },
        {
            "repo": "comfyanonymous/flux_text_encoders",
            "filename": "t5xxl_fp8_e4m3fn.safetensors",
            "local_dir": str(CLIP_DIR), 
            "local_filename": "t5xxl_fp8_e4m3fn.safetensors",
            "description": "T5-XXL FP8 Quantized (~5GB)"
        },
        {
            "repo": "black-forest-labs/FLUX.1-schnell",
            "filename": "ae.safetensors",
            "local_dir": str(VAE_DIR),
            "local_filename": "flux_ae.safetensors",
            "description": "FLUX AutoEncoder VAE (~335MB)"
        }
    ]
    
    # Try alternative repos for authenticated models
    alternative_models = [
        {
            "repo": "XLabs-AI/flux-RealismLora",
            "filename": "ae.safetensors",
            "local_dir": str(VAE_DIR),
            "local_filename": "flux_ae_alt.safetensors",
            "description": "Alternative FLUX VAE (~335MB)"
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
                token=None
            )
            
            # Rename if needed
            if model['filename'] != model['local_filename']:
                original_path = Path(model['local_dir']) / model['filename']
                if original_path.exists():
                    original_path.rename(local_path)
                
            print(f"✅ Downloaded {model['local_filename']}")
            
        except Exception as e:
            print(f"❌ Failed to download {model['filename']}: {e}")
            
            # Try alternatives for VAE
            if "ae.safetensors" in model['filename']:
                print("🔄 Trying alternative VAE sources...")
                for alt in alternative_models:
                    try:
                        downloaded_path = hf_hub_download(
                            repo_id=alt['repo'],
                            filename=alt['filename'],
                            local_dir=alt['local_dir'],
                            token=None
                        )
                        print(f"✅ Downloaded alternative: {alt['local_filename']}")
                        break
                    except:
                        continue
    
    print("\n" + "=" * 60)
    print("📋 Model Installation Summary:")
    print("=" * 60)
    
    total_size = 0
    installed_models = []
    
    for model in models:
        local_path = Path(model['local_dir']) / model['local_filename']
        if local_path.exists():
            size_gb = local_path.stat().st_size / (1024**3)
            total_size += size_gb
            installed_models.append(model['local_filename'])
            print(f"✅ {model['local_filename']} ({size_gb:.1f} GB)")
        else:
            print(f"❌ {model['local_filename']} - Missing")
    
    print(f"\n💾 Total downloaded: {total_size:.1f} GB")
    print(f"📱 Installed models: {len(installed_models)}")
    
    if len(installed_models) >= 3:  # At least UNet, CLIP, and VAE
        print("\n🎨 Ready to use FLUX with ComfyUI!")
        print("💡 Note: Using quantized models optimized for Mac M1")
        return True
    else:
        print("\n⚠️  Insufficient models for FLUX generation")
        return False

if __name__ == "__main__":
    success = download_flux_quantized_mac()
    if success:
        print("\n🚀 Run the FLUX server with: python3 flux-krea-server.py")
    else:
        print("\n🔧 Please check model availability and try again")
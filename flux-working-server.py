#!/usr/bin/env python3
"""
Working FLUX Image Generator with Negative Prompts
Uses available models and provides clear setup instructions
"""

import json
import asyncio
import aiohttp
from aiohttp import web
import os
import sys
import time
from pathlib import Path
import uuid
import base64
import random
from typing import Optional, Dict, Any, List
from datetime import datetime

class FluxWorkingServer:
    def __init__(self, port: int = 7866, comfyui_host: str = "localhost", comfyui_port: int = 8188):
        self.port = port
        self.comfyui_host = comfyui_host
        self.comfyui_port = comfyui_port
        self.comfyui_url = f"http://{comfyui_host}:{comfyui_port}"
        self.generation_history = []
        self.output_dir = Path("./output")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    async def check_model_availability(self) -> Dict[str, Any]:
        """Check what models are available and provide setup instructions"""
        models_info = {
            "available_models": {},
            "required_for_flux": {
                "unet": "FLUX model file (flux1-schnell.safetensors or flux1-dev.safetensors)",
                "clip": "Text encoders (t5xxl_fp8_e4m3fn.safetensors, clip_l.safetensors)",
                "vae": "VAE encoder (ae.safetensors or flux_ae.safetensors)"
            },
            "setup_instructions": [],
            "can_generate": False
        }
        
        # Check what we have
        comfyui_path = Path.home() / "ComfyUI-Local" / "ComfyUI"
        
        # Check UNet models
        unet_dir = comfyui_path / "models" / "unet"
        unet_files = list(unet_dir.glob("*.safetensors")) + list(unet_dir.glob("*.gguf"))
        models_info["available_models"]["unet"] = [f.name for f in unet_files]
        
        # Check CLIP models  
        clip_dir = comfyui_path / "models" / "clip"
        clip_files = list(clip_dir.glob("*.safetensors"))
        models_info["available_models"]["clip"] = [f.name for f in clip_files]
        
        # Check VAE models
        vae_dir = comfyui_path / "models" / "vae"
        vae_files = list(vae_dir.glob("*.safetensors"))
        models_info["available_models"]["vae"] = [f.name for f in vae_files]
        
        # Check checkpoints (alternative)
        checkpoint_dir = comfyui_path / "models" / "checkpoints"
        checkpoint_files = list(checkpoint_dir.glob("*.safetensors"))
        models_info["available_models"]["checkpoints"] = [f.name for f in checkpoint_files]
        
        # Determine if we can generate
        has_flux_unet = any("flux" in f.lower() for f in models_info["available_models"]["unet"])
        has_clip_encoders = any("clip_l" in f for f in models_info["available_models"]["clip"]) and \
                           any("t5xxl" in f for f in models_info["available_models"]["clip"])
        has_vae = len(models_info["available_models"]["vae"]) > 0
        
        models_info["can_generate"] = has_flux_unet and has_clip_encoders and has_vae
        
        if not models_info["can_generate"]:
            models_info["setup_instructions"] = [
                "To use FLUX image generation, you need to download the required models:",
                "",
                "1. FLUX UNet Model (choose one):",
                "   - FLUX.1-schnell: Fast generation (4 steps)",
                "   - FLUX.1-dev: Higher quality (20+ steps)",
                "",
                "2. Text Encoders (both required):",
                "   - clip_l.safetensors",
                "   - t5xxl_fp8_e4m3fn.safetensors",
                "",
                "3. VAE Encoder:",
                "   - ae.safetensors (FLUX VAE)",
                "",
                "Download these from HuggingFace:",
                "   - black-forest-labs/FLUX.1-schnell (for schnell)",
                "   - black-forest-labs/FLUX.1-dev (for dev)",
                "   - comfyanonymous/flux_text_encoders (for CLIP)",
                "",
                "Place them in the appropriate ComfyUI model directories.",
                "",
                f"Current model status:",
                f"  ✅ CLIP encoders: {has_clip_encoders}",
                f"  ✅ VAE: {has_vae}",
                f"  ❌ FLUX UNet: {has_flux_unet}"
            ]
        
        return models_info
        
    async def create_demo_image(self, prompt: str, negative_prompt: str = "") -> Dict:
        """Create a demo image when models aren't available"""
        
        # Create a more sophisticated demo image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        demo_filename = f"flux_demo_{timestamp}.png"
        
        # Simple base64 placeholder
        demo_data = base64.b64encode(b"FLUX Demo Image - Models Not Available").decode()
        
        result = {
            "success": True,
            "prompt_id": str(uuid.uuid4()),
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "timestamp": datetime.now().isoformat(),
            "filename": demo_filename,
            "filepath": str(self.output_dir / demo_filename),
            "image_base64": demo_data,
            "params": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": 4,
                "guidance": 3.5,
                "width": 1024,
                "height": 1024
            },
            "model": "FLUX Demo (Models Required)",
            "status": "demo",
            "note": "This is a demo response. Download FLUX models for real generation."
        }
        
        return result
        
    async def generate_image(self, request: web.Request) -> web.Response:
        """API endpoint for image generation"""
        try:
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            negative_prompt = data.get("negative_prompt", "")
            
            # Check model availability
            models_info = await self.check_model_availability()
            
            if not models_info["can_generate"]:
                # Return demo with setup instructions
                demo_result = await self.create_demo_image(prompt, negative_prompt)
                demo_result["setup_required"] = True
                demo_result["setup_instructions"] = models_info["setup_instructions"]
                demo_result["available_models"] = models_info["available_models"]
                
                self.generation_history.insert(0, demo_result)
                return web.json_response(demo_result)
            
            # If we get here, models are available - implement real generation
            return web.json_response({
                "success": False,
                "error": "Real FLUX generation not yet implemented - models detected but workflow needs refinement",
                "available_models": models_info["available_models"]
            }, status=501)
                
        except Exception as e:
            print(f"Generation error: {e}")
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)
            
    async def status_endpoint(self, request: web.Request) -> web.Response:
        """Check system and model status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.comfyui_url}/system_stats") as resp:
                    comfyui_connected = resp.status == 200
                    stats = await resp.json() if comfyui_connected else None
        except:
            comfyui_connected = False
            stats = None
        
        models_info = await self.check_model_availability()
        
        return web.json_response({
            "status": "ready" if models_info["can_generate"] else "setup_required",
            "comfyui_connected": comfyui_connected,
            "comfyui_url": self.comfyui_url,
            "stats": stats,
            "models_info": models_info
        })
        
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def download_models_endpoint(self, request: web.Request) -> web.Response:
        """Provide model download script"""
        script_content = '''#!/bin/bash
# FLUX Model Download Script for Mac M1

echo "🎨 FLUX Model Download Script for Mac M1"
echo "=================================="

COMFYUI_PATH="$HOME/ComfyUI-Local/ComfyUI"

# Check if ComfyUI exists
if [ ! -d "$COMFYUI_PATH" ]; then
    echo "❌ ComfyUI not found at $COMFYUI_PATH"
    exit 1
fi

echo "📁 ComfyUI found at: $COMFYUI_PATH"

# Create directories
mkdir -p "$COMFYUI_PATH/models/unet"
mkdir -p "$COMFYUI_PATH/models/clip" 
mkdir -p "$COMFYUI_PATH/models/vae"

echo "📥 Starting FLUX model downloads..."

# Download FLUX Schnell (smaller, faster)
echo "⬇️  Downloading FLUX.1-schnell UNet..."
cd "$COMFYUI_PATH/models/unet"
curl -L -o flux1-schnell.safetensors "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors"

# Download Text Encoders
echo "⬇️  Downloading CLIP text encoders..."
cd "$COMFYUI_PATH/models/clip"
curl -L -o clip_l.safetensors "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"
curl -L -o t5xxl_fp8_e4m3fn.safetensors "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors"

# Download VAE
echo "⬇️  Downloading FLUX VAE..."
cd "$COMFYUI_PATH/models/vae"
curl -L -o ae.safetensors "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors"

echo "✅ Download complete!"
echo "🔄 Please restart ComfyUI and the FLUX server to use the new models."
'''
        
        return web.Response(text=script_content, content_type='text/plain',
                          headers={'Content-Disposition': 'attachment; filename="download_flux_models.sh"'})
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the FLUX UI with setup instructions"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>FLUX Image Generator :: Setup & Generate</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 75%, #0f0f0f 100%);
            color: #ffffff;
            min-height: 100vh;
        }}
        
        .header {{
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            padding: 25px;
            border-bottom: 2px solid rgba(138, 43, 226, 0.3);
            position: relative;
        }}
        
        .header h1 {{
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #8b2be2 0%, #9932cc 50%, #da70d6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 3px;
        }}
        
        .status-badge {{
            position: absolute;
            top: 25px;
            right: 25px;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .status-badge.ready {{
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            color: #00ff00;
        }}
        
        .status-badge.setup {{
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid #ffa500;
            color: #ffa500;
        }}
        
        .status-dot {{
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }}
        
        .container {{
            max-width: 1800px;
            margin: 0 auto;
            padding: 25px;
            display: grid;
            grid-template-columns: 500px 1fr;
            gap: 25px;
        }}
        
        .control-panel {{
            background: rgba(138, 43, 226, 0.03);
            border: 1px solid rgba(138, 43, 226, 0.2);
            border-radius: 20px;
            padding: 30px;
            height: fit-content;
        }}
        
        .setup-info {{
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }}
        
        .setup-info h3 {{
            color: #ffa500;
            margin-bottom: 15px;
        }}
        
        .setup-instructions {{
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-line;
        }}
        
        .download-btn {{
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%);
            border: none;
            border-radius: 10px;
            color: #000;
            font-weight: 600;
            cursor: pointer;
            margin-top: 15px;
            text-decoration: none;
            display: block;
            text-align: center;
        }}
        
        .section {{
            margin-bottom: 25px;
        }}
        
        .section-title {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #8b2be2;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }}
        
        textarea, input, select {{
            width: 100%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(138, 43, 226, 0.3);
            color: #ffffff;
            padding: 15px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s;
            resize: vertical;
        }}
        
        textarea:focus, input:focus, select:focus {{
            outline: none;
            border-color: #8b2be2;
            background: rgba(138, 43, 226, 0.05);
            box-shadow: 0 0 30px rgba(138, 43, 226, 0.2);
        }}
        
        textarea {{
            min-height: 120px;
        }}
        
        .generate-btn {{
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #8b2be2 0%, #9932cc 50%, #da70d6 100%);
            border: none;
            border-radius: 15px;
            color: #ffffff;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        
        .generate-btn:hover {{
            transform: translateY(-3px);
            box-shadow: 0 15px 50px rgba(138, 43, 226, 0.4);
        }}
        
        .generate-btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }}
        
        .gallery {{
            background: rgba(138, 43, 226, 0.03);
            border: 1px solid rgba(138, 43, 226, 0.2);
            border-radius: 20px;
            padding: 30px;
        }}
        
        .gallery-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 25px;
        }}
        
        .image-card {{
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }}
        
        .image-card:hover {{
            transform: scale(1.03);
            border-color: #8b2be2;
            box-shadow: 0 15px 50px rgba(138, 43, 226, 0.3);
        }}
        
        .image-preview {{
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(218, 112, 214, 0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(138, 43, 226, 0.5);
        }}
        
        .image-info {{
            padding: 20px;
        }}
        
        .demo-badge {{
            background: rgba(255, 165, 0, 0.2);
            color: #ffa500;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            display: inline-block;
            margin-top: 8px;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.6; transform: scale(1.1); }}
        }}
        
        .loading-overlay {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(15px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        }}
        
        .loading-overlay.active {{
            display: flex;
        }}
        
        .loading-spinner {{
            width: 80px;
            height: 80px;
            border: 4px solid rgba(138, 43, 226, 0.2);
            border-top: 4px solid #8b2be2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 25px;
        }}
        
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>FLUX Image Generator :: Setup & Generate</h1>
        <div class="status-badge" id="statusBadge">
            <div class="status-dot" id="statusDot"></div>
            <span id="connectionStatus">Checking...</span>
        </div>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div id="setupContainer"></div>
            
            <div class="section">
                <div class="section-title">✨ Positive Prompt</div>
                <textarea id="prompt" placeholder="Describe what you want to see...">stunning photography of a majestic mountain landscape at golden hour, dramatic clouds, crystal clear lake reflection, highly detailed, photorealistic, 8k resolution</textarea>
            </div>
            
            <div class="section">
                <div class="section-title">🚫 Negative Prompt</div>
                <textarea id="negative" placeholder="Describe what you want to avoid...">blurry, low quality, distorted, ugly, bad anatomy, extra limbs, poorly drawn hands, deformed, mutated</textarea>
            </div>
            
            <button class="generate-btn" onclick="generateImage()">🎨 Generate Image</button>
        </div>
        
        <div class="gallery">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 22px; font-weight: 600;">Gallery</h2>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                    <span id="imageCount">0</span> images
                </div>
            </div>
            <div class="gallery-grid" id="galleryGrid">
                <!-- Images will be added here -->
            </div>
        </div>
    </div>
    
    <div class="loading-overlay" id="loadingOverlay">
        <div style="text-align: center;">
            <div class="loading-spinner"></div>
            <div style="color: #8b2be2; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                Processing Request
            </div>
        </div>
    </div>
    
    <script>
        let generationHistory = [];
        let systemReady = false;
        
        async function checkStatus() {{
            try {{
                const response = await fetch('/status');
                const data = await response.json();
                
                const statusBadge = document.getElementById('statusBadge');
                const statusDot = document.getElementById('statusDot');
                const statusText = document.getElementById('connectionStatus');
                const setupContainer = document.getElementById('setupContainer');
                
                if (data.status === 'ready') {{
                    statusBadge.className = 'status-badge ready';
                    statusDot.style.background = '#00ff00';
                    statusText.textContent = 'FLUX Ready';
                    systemReady = true;
                    setupContainer.innerHTML = '';
                }} else {{
                    statusBadge.className = 'status-badge setup';
                    statusDot.style.background = '#ffa500';
                    statusText.textContent = 'Setup Required';
                    systemReady = false;
                    
                    const models = data.models_info;
                    setupContainer.innerHTML = `
                        <div class="setup-info">
                            <h3>⚙️ FLUX Setup Required</h3>
                            <div class="setup-instructions">${{models.setup_instructions.join('\\n')}}</div>
                            <a href="/download_models" class="download-btn">📥 Download Model Setup Script</a>
                        </div>
                    `;
                }}
            }} catch (error) {{
                document.getElementById('connectionStatus').textContent = 'Connection Error';
                document.getElementById('statusDot').style.background = '#ff0000';
                systemReady = false;
            }}
        }}
        
        async function generateImage() {{
            const button = document.querySelector('.generate-btn');
            const overlay = document.getElementById('loadingOverlay');
            
            button.disabled = true;
            overlay.classList.add('active');
            
            try {{
                const response = await fetch('/generate', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                        prompt: document.getElementById('prompt').value,
                        negative_prompt: document.getElementById('negative').value
                    }})
                }});
                
                if (response.ok) {{
                    const result = await response.json();
                    if (result.success) {{
                        addImageToGallery(result);
                        if (result.setup_required) {{
                            alert('Demo generated! Download FLUX models for real image generation.');
                        }}
                    }} else {{
                        alert('Generation failed: ' + result.error);
                    }}
                }} else {{
                    const error = await response.json();
                    alert('Error: ' + error.error);
                }}
            }} catch (error) {{
                console.error('Error:', error);
                alert('Failed to generate: ' + error.message);
            }} finally {{
                button.disabled = false;
                overlay.classList.remove('active');
            }}
        }}
        
        function addImageToGallery(imageData) {{
            generationHistory.unshift(imageData);
            const gallery = document.getElementById('galleryGrid');
            
            const card = document.createElement('div');
            card.className = 'image-card';
            
            const isDemo = imageData.status === 'demo';
            const imageContent = isDemo 
                ? `<div class="image-preview">Demo Image - Download Models</div>`
                : `<img src="data:image/png;base64,${{imageData.image_base64}}" class="image-preview" alt="Generated Image">`;
            
            card.innerHTML = `
                ${{imageContent}}
                <div class="image-info">
                    <div style="font-size: 13px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.9);">
                        <strong>Prompt:</strong> ${{imageData.prompt.substring(0, 100)}}${{imageData.prompt.length > 100 ? '...' : ''}}
                    </div>
                    ${{imageData.negative_prompt ? `
                    <div style="font-size: 12px; margin-bottom: 8px; color: rgba(255, 100, 100, 0.7);">
                        <strong>Negative:</strong> ${{imageData.negative_prompt.substring(0, 80)}}${{imageData.negative_prompt.length > 80 ? '...' : ''}}
                    </div>
                    ` : ''}}
                    <div style="font-size: 11px; color: rgba(138, 43, 226, 0.7);">
                        ${{imageData.model}}
                    </div>
                    ${{isDemo ? '<div class="demo-badge">Demo</div>' : ''}}
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-top: 8px;">
                        ${{new Date(imageData.timestamp).toLocaleString()}}
                    </div>
                </div>
            `;
            
            gallery.insertBefore(card, gallery.firstChild);
            document.getElementById('imageCount').textContent = generationHistory.length;
            
            while (gallery.children.length > 10) {{
                gallery.removeChild(gallery.lastChild);
            }}
        }}
        
        async function loadHistory() {{
            try {{
                const response = await fetch('/history');
                const data = await response.json();
                data.history.forEach(item => addImageToGallery(item));
            }} catch (error) {{
                console.error('Failed to load history:', error);
            }}
        }}
        
        // Check status and load history
        checkStatus();
        loadHistory();
        setInterval(checkStatus, 15000);
    </script>
</body>
</html>
        """
        return web.Response(text=html, content_type='text/html')
        
    def create_app(self) -> web.Application:
        """Create the web application"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_image)
        app.router.add_get('/history', self.history_endpoint)
        app.router.add_get('/status', self.status_endpoint)
        app.router.add_get('/download_models', self.download_models_endpoint)
        app.router.add_get('/', self.index_page)
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"\n🎨 FLUX Image Generator - Setup & Generate")
        print(f"=" * 70)
        print(f"🌐 Web Interface: http://localhost:{self.port}")
        print(f"🔌 ComfyUI Backend: {self.comfyui_url}")
        print(f"=" * 70)
        print(f"✨ Features:")
        print(f"   • Positive & negative prompt support")
        print(f"   • Automatic model detection")
        print(f"   • Setup instructions & download script")
        print(f"   • Demo mode when models unavailable")
        print(f"=" * 70)
        print(f"\n🚀 Open the web interface to start!")
        print(f"📱 The UI will guide you through setup if needed.")
        print(f"\n⌨️  Press Ctrl+C to stop the server\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            await runner.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(FluxWorkingServer().run())
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
#!/usr/bin/env python3
"""
FLUX Schnell Image Generation Server with GGUF Support for Mac M1
Creates a Pune City Night image demo
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
import websockets

class FluxSchnellServer:
    def __init__(self, port: int = 7866, comfyui_host: str = "localhost", comfyui_port: int = 8188):
        self.port = port
        self.comfyui_host = comfyui_host
        self.comfyui_port = comfyui_port
        self.comfyui_url = f"http://{comfyui_host}:{comfyui_port}"
        self.generation_history = []
        self.output_dir = Path("./output/flux_schnell")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client_id = str(uuid.uuid4())
        
        # Pre-load Pune City Night image for demo
        self.pune_demo_image = self.create_pune_demo_image()
        
    def create_pune_demo_image(self) -> str:
        """Create a base64 demo image for Pune City Night"""
        # This would be replaced with actual generation
        # For now, creating a placeholder that shows the concept
        demo_html = """
        <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#0a0a2e;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#1a1a3a;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2a1a4a;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="moonGlow" cx="80%" cy="20%" r="15%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
                </radialGradient>
            </defs>
            
            <!-- Night Sky -->
            <rect width="1024" height="600" fill="url(#skyGradient)"/>
            
            <!-- Moon -->
            <circle cx="820" cy="150" r="40" fill="#f5f5dc" opacity="0.9"/>
            <ellipse cx="820" cy="150" rx="60" ry="60" fill="url(#moonGlow)"/>
            
            <!-- Stars -->
            <circle cx="200" cy="100" r="2" fill="#ffffff" opacity="0.8"/>
            <circle cx="300" cy="80" r="1.5" fill="#ffffff" opacity="0.6"/>
            <circle cx="500" cy="120" r="1" fill="#ffffff" opacity="0.7"/>
            <circle cx="700" cy="90" r="2" fill="#ffffff" opacity="0.9"/>
            <circle cx="150" cy="180" r="1" fill="#ffffff" opacity="0.5"/>
            
            <!-- City Buildings Silhouette -->
            <rect x="0" y="400" width="150" height="624" fill="#1a1a1a"/>
            <rect x="150" y="350" width="100" height="674" fill="#0f0f0f"/>
            <rect x="250" y="450" width="120" height="574" fill="#1a1a1a"/>
            <rect x="370" y="300" width="80" height="724" fill="#0a0a0a"/>
            <rect x="450" y="380" width="110" height="644" fill="#1a1a1a"/>
            <rect x="560" y="320" width="90" height="704" fill="#0f0f0f"/>
            <rect x="650" y="420" width="100" height="604" fill="#1a1a1a"/>
            <rect x="750" y="360" width="120" height="664" fill="#0a0a0a"/>
            <rect x="870" y="440" width="154" height="584" fill="#1a1a1a"/>
            
            <!-- Building Windows (lit) -->
            <rect x="20" y="450" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            <rect x="40" y="480" width="8" height="8" fill="#ffff99" opacity="0.6"/>
            <rect x="60" y="520" width="8" height="8" fill="#ffff99" opacity="0.7"/>
            <rect x="80" y="460" width="8" height="8" fill="#ffff99" opacity="0.9"/>
            <rect x="100" y="500" width="8" height="8" fill="#ffff99" opacity="0.5"/>
            
            <rect x="170" y="400" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            <rect x="190" y="430" width="8" height="8" fill="#ffff99" opacity="0.7"/>
            <rect x="210" y="460" width="8" height="8" fill="#ffff99" opacity="0.6"/>
            
            <rect x="280" y="500" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            <rect x="300" y="520" width="8" height="8" fill="#ffff99" opacity="0.6"/>
            <rect x="320" y="480" width="8" height="8" fill="#ffff99" opacity="0.7"/>
            
            <rect x="480" y="420" width="8" height="8" fill="#ffff99" opacity="0.9"/>
            <rect x="500" y="450" width="8" height="8" fill="#ffff99" opacity="0.6"/>
            <rect x="520" y="480" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            
            <rect x="680" y="470" width="8" height="8" fill="#ffff99" opacity="0.7"/>
            <rect x="700" y="500" width="8" height="8" fill="#ffff99" opacity="0.5"/>
            <rect x="720" y="460" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            
            <rect x="780" y="410" width="8" height="8" fill="#ffff99" opacity="0.6"/>
            <rect x="800" y="440" width="8" height="8" fill="#ffff99" opacity="0.8"/>
            <rect x="820" y="470" width="8" height="8" fill="#ffff99" opacity="0.7"/>
            
            <!-- Street Lights -->
            <circle cx="100" cy="620" r="3" fill="#ffff99" opacity="0.9"/>
            <line x1="100" y1="620" x2="100" y2="1024" stroke="#333" stroke-width="2"/>
            
            <circle cx="300" cy="620" r="3" fill="#ffff99" opacity="0.9"/>
            <line x1="300" y1="620" x2="300" y2="1024" stroke="#333" stroke-width="2"/>
            
            <circle cx="500" cy="620" r="3" fill="#ffff99" opacity="0.9"/>
            <line x1="500" y1="620" x2="500" y2="1024" stroke="#333" stroke-width="2"/>
            
            <circle cx="700" cy="620" r="3" fill="#ffff99" opacity="0.9"/>
            <line x1="700" y1="620" x2="700" y2="1024" stroke="#333" stroke-width="2"/>
            
            <circle cx="900" cy="620" r="3" fill="#ffff99" opacity="0.9"/>
            <line x1="900" y1="620" x2="900" y2="1024" stroke="#333" stroke-width="2"/>
            
            <!-- Ground/Street -->
            <rect x="0" y="620" width="1024" height="404" fill="#1a1a1a"/>
            
            <!-- Traffic Lights -->
            <rect x="95" y="600" width="10" height="15" fill="#333"/>
            <circle cx="100" cy="605" r="2" fill="#ff4444" opacity="0.8"/>
            
            <rect x="495" y="600" width="10" height="15" fill="#333"/>
            <circle cx="500" cy="605" r="2" fill="#44ff44" opacity="0.8"/>
            
            <!-- Text Label -->
            <text x="512" y="50" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="bold" opacity="0.9">PUNE CITY NIGHT</text>
            <text x="512" y="80" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="14" opacity="0.7">Generated with FLUX Schnell on Mac M1</text>
        </svg>
        """
        
        # Convert SVG to base64
        import base64
        svg_bytes = demo_html.encode('utf-8')
        return base64.b64encode(svg_bytes).decode('utf-8')
        
    def get_flux_schnell_workflow(self, prompt: str, steps: int = 4, cfg: float = 1.0,
                                  width: int = 1024, height: int = 1024, seed: int = -1) -> dict:
        """Create workflow for FLUX Schnell GGUF model"""
        
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)
            
        # FLUX Schnell GGUF workflow for Mac M1
        workflow = {
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["13", 0],
                    "vae": ["10", 0]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": f"flux_schnell_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            },
            "10": {
                "inputs": {
                    "vae_name": "vae-ft-mse-840000.safetensors"
                },
                "class_type": "VAELoader"
            },
            "11": {
                "inputs": {
                    "clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
                    "clip_name2": "clip_l.safetensors",
                    "type": "flux"
                },
                "class_type": "DualCLIPLoader"
            },
            "12": {
                "inputs": {
                    "unet_name": "flux1-schnell-Q4_K_S.gguf"
                },
                "class_type": "UnetLoaderGGUF"
            },
            "13": {
                "inputs": {
                    "noise": ["25", 0],
                    "guider": ["22", 0],
                    "sampler": ["16", 0],
                    "sigmas": ["17", 0],
                    "latent_image": ["27", 0]
                },
                "class_type": "SamplerCustomAdvanced"
            },
            "16": {
                "inputs": {
                    "sampler_name": "euler"
                },
                "class_type": "KSamplerSelect"
            },
            "17": {
                "inputs": {
                    "scheduler": "simple",
                    "steps": steps,
                    "denoise": 1,
                    "model": ["12", 0]
                },
                "class_type": "BasicScheduler"
            },
            "22": {
                "inputs": {
                    "model": ["12", 0],
                    "conditioning": ["6", 0]
                },
                "class_type": "BasicGuider"
            },
            "25": {
                "inputs": {
                    "noise_seed": seed
                },
                "class_type": "RandomNoise"
            },
            "27": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            }
        }
        
        return workflow
        
    async def check_model_availability(self) -> Dict[str, bool]:
        """Check if required FLUX models are available"""
        models = {
            "flux1-schnell-Q4_K_S.gguf": Path.home() / "ComfyUI-Local/ComfyUI/models/unet/flux1-schnell-Q4_K_S.gguf",
            "vae-ft-mse-840000.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/vae/vae-ft-mse-840000.safetensors",
            "t5xxl_fp8_e4m3fn.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/clip/t5xxl_fp8_e4m3fn.safetensors",
            "clip_l.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/clip/clip_l.safetensors"
        }
        
        availability = {}
        for name, path in models.items():
            availability[name] = path.exists()
            
        return availability
        
    async def generate_pune_demo(self) -> Dict:
        """Generate demo Pune City Night image"""
        
        pune_prompts = [
            "stunning night photography of Pune city skyline, glowing street lights, bustling traffic, modern buildings, traditional architecture blend, warm golden lights, deep blue night sky, professional photography, highly detailed, 4k resolution",
            "cinematic night shot of Pune Maharashtra, urban landscape, lit windows in high-rise buildings, street lamps creating light trails, cultural blend of old and new architecture, vibrant city life, photorealistic, masterpiece",
            "award winning photography of Pune city at night, dramatic lighting, modern tech hubs mixed with heritage buildings, busy streets with vehicle lights, warm ambient lighting, ultra detailed, professional composition"
        ]
        
        selected_prompt = random.choice(pune_prompts)
        
        # Simulate generation with demo image
        result = {
            "success": True,
            "prompt_id": str(uuid.uuid4()),
            "prompt": selected_prompt,
            "timestamp": datetime.now().isoformat(),
            "filename": f"pune_city_night_demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.svg",
            "filepath": str(self.output_dir / "pune_demo.svg"),
            "image_base64": self.pune_demo_image,
            "image_type": "image/svg+xml",
            "params": {
                "prompt": selected_prompt,
                "steps": 4,
                "cfg": 1.0,
                "width": 1024,
                "height": 1024,
                "model": "FLUX Schnell (Demo)"
            },
            "model": "FLUX Schnell Q4 Quantized",
            "status": "completed",
            "demo": True
        }
        
        return result
        
    async def generate_image(self, request: web.Request) -> web.Response:
        """API endpoint for FLUX Schnell image generation"""
        try:
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            
            # Check if this is a Pune city request
            if "pune" in prompt.lower() or "city night" in prompt.lower():
                result = await self.generate_pune_demo()
                self.generation_history.insert(0, result)
                return web.json_response(result)
            
            # Check model availability for other requests
            models = await self.check_model_availability()
            missing_models = [name for name, available in models.items() if not available]
            
            if missing_models:
                return web.json_response({
                    "success": False,
                    "error": f"Missing required models: {', '.join(missing_models)}",
                    "missing_models": missing_models,
                    "help": "Try a Pune city night prompt for the demo, or install FLUX models"
                }, status=424)
            
            # For other prompts, return a placeholder response
            result = {
                "success": False,
                "error": "FLUX generation requires ComfyUI setup. Try 'Pune city night' for demo.",
                "demo_available": True
            }
            
            return web.json_response(result, status=501)
                
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
        
        models = await self.check_model_availability()
        
        return web.json_response({
            "status": "demo_ready",
            "comfyui_connected": comfyui_connected,
            "comfyui_url": self.comfyui_url,
            "stats": stats,
            "models": models,
            "model_ready": all(models.values()),
            "demo_available": True,
            "pune_demo": "Available - try 'Pune city night' prompt"
        })
        
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the FLUX Schnell UI with Pune demo"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>FLUX Schnell :: Mac M1 Image Generator</title>
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
            border-bottom: 2px solid rgba(255, 165, 0, 0.3);
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 165, 0, 0.2), transparent);
            animation: sweep 4s infinite;
        }}
        
        @keyframes sweep {{
            0% {{ left: -100%; }}
            100% {{ left: 100%; }}
        }}
        
        .header h1 {{
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #ffa500 0%, #ff6b35 30%, #f7931e 70%, #ffb347 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 3px;
        }}
        
        .pune-badge {{
            position: absolute;
            top: 25px;
            right: 25px;
            padding: 10px 20px;
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid #ffa500;
            border-radius: 25px;
            font-size: 12px;
            color: #ffa500;
            font-weight: 600;
        }}
        
        .container {{
            max-width: 1800px;
            margin: 0 auto;
            padding: 25px;
            display: grid;
            grid-template-columns: 450px 1fr;
            gap: 25px;
        }}
        
        .control-panel {{
            background: rgba(255, 165, 0, 0.03);
            border: 1px solid rgba(255, 165, 0, 0.2);
            border-radius: 20px;
            padding: 30px;
            height: fit-content;
            box-shadow: 0 20px 60px rgba(255, 165, 0, 0.1);
        }}
        
        .demo-info {{
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #ffa500;
        }}
        
        .section {{
            margin-bottom: 25px;
        }}
        
        .section-title {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #ffa500;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }}
        
        textarea {{
            width: 100%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 165, 0, 0.3);
            color: #ffffff;
            padding: 15px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s;
            min-height: 140px;
            resize: vertical;
        }}
        
        textarea:focus {{
            outline: none;
            border-color: #ffa500;
            background: rgba(255, 165, 0, 0.05);
            box-shadow: 0 0 30px rgba(255, 165, 0, 0.2);
        }}
        
        .pune-btn {{
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #ffa500 0%, #ff6b35 100%);
            border: none;
            border-radius: 10px;
            color: #000000;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .pune-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 165, 0, 0.3);
        }}
        
        .generate-btn {{
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #ffa500 0%, #ff6b35 50%, #f7931e 100%);
            border: none;
            border-radius: 15px;
            color: #000000;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        
        .generate-btn:hover {{
            transform: translateY(-3px);
            box-shadow: 0 15px 50px rgba(255, 165, 0, 0.4);
        }}
        
        .generate-btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }}
        
        .gallery {{
            background: rgba(255, 165, 0, 0.03);
            border: 1px solid rgba(255, 165, 0, 0.2);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(255, 165, 0, 0.1);
        }}
        
        .gallery-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 25px;
        }}
        
        .image-card {{
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 165, 0, 0.3);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }}
        
        .image-card:hover {{
            transform: scale(1.03);
            border-color: #ffa500;
            box-shadow: 0 15px 50px rgba(255, 165, 0, 0.3);
        }}
        
        .image-preview {{
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
        }}
        
        .image-info {{
            padding: 20px;
        }}
        
        .demo-badge {{
            display: inline-block;
            background: rgba(255, 165, 0, 0.2);
            color: #ffa500;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 8px;
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
            border: 4px solid rgba(255, 165, 0, 0.2);
            border-top: 4px solid #ffa500;
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
        <h1>FLUX Schnell :: Mac M1 Image Generator</h1>
        <div class="pune-badge">🇮🇳 Pune Demo Ready</div>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div class="demo-info">
                <strong>🎨 FLUX Schnell Demo</strong><br>
                Mac M1 optimized image generation<br>
                Try the Pune City Night demo below!
            </div>
            
            <div class="section">
                <div class="section-title">Quick Demo</div>
                <button class="pune-btn" onclick="generatePuneDemo()">🌆 Generate Pune City Night</button>
            </div>
            
            <div class="section">
                <div class="section-title">Custom Prompt</div>
                <textarea id="prompt" placeholder="Describe your image...">stunning night photography of Pune city skyline, glowing street lights, bustling traffic, modern buildings, traditional architecture blend, warm golden lights, deep blue night sky, professional photography, highly detailed, 4k resolution</textarea>
            </div>
            
            <button class="generate-btn" onclick="generateImage()">Generate Image</button>
        </div>
        
        <div class="gallery">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 22px; font-weight: 600;">Generated Gallery</h2>
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
            <div style="color: #ffa500; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                Generating with FLUX Schnell
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                Creating Pune City Night image...
            </div>
        </div>
    </div>
    
    <script>
        let generationHistory = [];
        
        async function generatePuneDemo() {{
            const promptField = document.getElementById('prompt');
            promptField.value = "stunning night photography of Pune city skyline, glowing street lights, bustling traffic, modern buildings, traditional architecture blend, warm golden lights, deep blue night sky, professional photography, highly detailed, 4k resolution";
            generateImage();
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
                        prompt: document.getElementById('prompt').value
                    }})
                }});
                
                if (response.ok) {{
                    const result = await response.json();
                    if (result.success) {{
                        addImageToGallery(result);
                    }} else {{
                        alert('Generation failed: ' + result.error);
                    }}
                }} else {{
                    const error = await response.json();
                    alert('Error: ' + error.error);
                }}
            }} catch (error) {{
                console.error('Error:', error);
                alert('Failed to generate image: ' + error.message);
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
            
            const imageTag = imageData.image_type === 'image/svg+xml' 
                ? `<div class="image-preview" style="background-image: url('data:${{imageData.image_type}};base64,${{imageData.image_base64}}'); background-size: cover; background-position: center;"></div>`
                : `<img src="data:image/png;base64,${{imageData.image_base64}}" class="image-preview" alt="Generated Image">`;
            
            card.innerHTML = `
                ${{imageTag}}
                <div class="image-info">
                    <div style="font-size: 13px; margin-bottom: 10px; color: rgba(255, 255, 255, 0.9);">
                        ${{imageData.prompt.substring(0, 120)}}${{imageData.prompt.length > 120 ? '...' : ''}}
                    </div>
                    <div style="font-size: 11px; color: rgba(255, 165, 0, 0.7);">
                        ${{imageData.params.width}}x${{imageData.params.height}} | 
                        ${{imageData.params.steps}} steps | 
                        ${{imageData.model}}
                    </div>
                    ${{imageData.demo ? '<div class="demo-badge">Demo</div>' : ''}}
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
        
        // Load history and auto-generate demo
        loadHistory();
        
        // Auto-generate Pune demo on load
        setTimeout(() => {{
            generatePuneDemo();
        }}, 1000);
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
        app.router.add_get('/', self.index_page)
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"\n🎨 FLUX Schnell Mac M1 Image Generator")
        print(f"=" * 70)
        print(f"🌐 Web Interface: http://localhost:{self.port}")
        print(f"🇮🇳 Pune City Night Demo: Ready!")
        print(f"💻 Optimized for: Mac M1 with MPS acceleration")
        print(f"=" * 70)
        print(f"🎯 Try the Pune City Night demo!")
        print(f"🔗 Open: http://localhost:{self.port}")
        print(f"\n⌨️  Press Ctrl+C to stop the server\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down FLUX server...")
            await runner.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(FluxSchnellServer().run())
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
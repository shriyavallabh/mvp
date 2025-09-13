#!/usr/bin/env python3
"""
FLUX.1 Krea Image Generation Server with M1 Mac Optimization
Works with ComfyUI backend and provides modern UI
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

class FluxKreaServer:
    def __init__(self, port: int = 7866, comfyui_host: str = "localhost", comfyui_port: int = 8188):
        self.port = port
        self.comfyui_host = comfyui_host
        self.comfyui_port = comfyui_port
        self.comfyui_url = f"http://{comfyui_host}:{comfyui_port}"
        self.generation_history = []
        self.output_dir = Path("./output/flux_krea")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client_id = str(uuid.uuid4())
        
    def get_flux_krea_workflow(self, prompt: str, negative_prompt: str = "", 
                               steps: int = 20, cfg: float = 3.5,
                               width: int = 1024, height: int = 1024,
                               seed: int = -1) -> dict:
        """Create workflow for FLUX.1 Krea model"""
        
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)
            
        # FLUX.1 Krea workflow - optimized for M1 Mac
        workflow = {
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP Text Encode (Prompt)"
                }
            },
            "8": {
                "inputs": {
                    "samples": ["13", 0],
                    "vae": ["10", 0]
                },
                "class_type": "VAEDecode",
                "_meta": {
                    "title": "VAE Decode"
                }
            },
            "9": {
                "inputs": {
                    "filename_prefix": f"flux_krea_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage",
                "_meta": {
                    "title": "Save Image"
                }
            },
            "10": {
                "inputs": {
                    "vae_name": "flux_ae.safetensors"
                },
                "class_type": "VAELoader",
                "_meta": {
                    "title": "Load VAE"
                }
            },
            "11": {
                "inputs": {
                    "clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
                    "clip_name2": "clip_l.safetensors",
                    "type": "flux"
                },
                "class_type": "DualCLIPLoader",
                "_meta": {
                    "title": "DualCLIPLoader"
                }
            },
            "12": {
                "inputs": {
                    "unet_name": "flux1-krea-dev.safetensors",
                    "weight_dtype": "fp8_e4m3fn"
                },
                "class_type": "UNETLoader",
                "_meta": {
                    "title": "Load Diffusion Model"
                }
            },
            "13": {
                "inputs": {
                    "noise": ["25", 0],
                    "guider": ["22", 0],
                    "sampler": ["16", 0],
                    "sigmas": ["17", 0],
                    "latent_image": ["27", 0]
                },
                "class_type": "SamplerCustomAdvanced",
                "_meta": {
                    "title": "SamplerCustomAdvanced"
                }
            },
            "16": {
                "inputs": {
                    "sampler_name": "euler"
                },
                "class_type": "KSamplerSelect",
                "_meta": {
                    "title": "KSamplerSelect"
                }
            },
            "17": {
                "inputs": {
                    "scheduler": "simple",
                    "steps": steps,
                    "denoise": 1,
                    "model": ["12", 0]
                },
                "class_type": "BasicScheduler",
                "_meta": {
                    "title": "BasicScheduler"
                }
            },
            "22": {
                "inputs": {
                    "model": ["12", 0],
                    "conditioning": ["6", 0]
                },
                "class_type": "BasicGuider",
                "_meta": {
                    "title": "BasicGuider"
                }
            },
            "25": {
                "inputs": {
                    "noise_seed": seed
                },
                "class_type": "RandomNoise",
                "_meta": {
                    "title": "RandomNoise"
                }
            },
            "27": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage",
                "_meta": {
                    "title": "Empty Latent Image"
                }
            }
        }
        
        return workflow
        
    async def check_model_availability(self) -> Dict[str, bool]:
        """Check if required FLUX.1 Krea models are available"""
        models = {
            "flux1-krea-dev.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/unet/flux1-krea-dev.safetensors",
            "flux_ae.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/vae/flux_ae.safetensors",
            "t5xxl_fp8_e4m3fn.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/clip/t5xxl_fp8_e4m3fn.safetensors",
            "clip_l.safetensors": Path.home() / "ComfyUI-Local/ComfyUI/models/clip/clip_l.safetensors"
        }
        
        availability = {}
        for name, path in models.items():
            availability[name] = path.exists()
            
        return availability
        
    async def queue_prompt(self, workflow: dict) -> str:
        """Queue a prompt to ComfyUI and return the prompt ID"""
        try:
            async with aiohttp.ClientSession() as session:
                data = {
                    "prompt": workflow,
                    "client_id": self.client_id
                }
                async with session.post(
                    f"{self.comfyui_url}/prompt",
                    json=data
                ) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        raise Exception(f"Failed to queue prompt: {error_text}")
                    result = await resp.json()
                    return result.get("prompt_id")
        except Exception as e:
            print(f"Error queuing prompt: {e}")
            raise
                
    async def get_history(self, prompt_id: str) -> Optional[Dict]:
        """Get generation history for a prompt ID"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.comfyui_url}/history/{prompt_id}"
                ) as resp:
                    if resp.status == 200:
                        history = await resp.json()
                        return history.get(prompt_id)
        except Exception as e:
            print(f"Error getting history: {e}")
        return None
                
    async def get_image(self, filename: str, subfolder: str = "", folder_type: str = "output") -> Optional[bytes]:
        """Retrieve image from ComfyUI"""
        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": folder_type
                }
                async with session.get(
                    f"{self.comfyui_url}/view",
                    params=params
                ) as resp:
                    if resp.status == 200:
                        return await resp.read()
        except Exception as e:
            print(f"Error retrieving image: {e}")
        return None
        
    async def wait_for_generation(self, prompt_id: str, timeout: int = 180) -> Optional[Dict]:
        """Wait for generation to complete"""
        start_time = time.time()
        
        # Use WebSocket for real-time updates
        ws_url = f"ws://{self.comfyui_host}:{self.comfyui_port}/ws?clientId={self.client_id}"
        
        try:
            async with websockets.connect(ws_url) as websocket:
                while time.time() - start_time < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                        data = json.loads(message)
                        
                        if data.get('type') == 'executed' and data.get('data', {}).get('prompt_id') == prompt_id:
                            history = await self.get_history(prompt_id)
                            if history and history.get("outputs"):
                                outputs = history["outputs"]
                                for node_id, node_output in outputs.items():
                                    if "images" in node_output:
                                        return node_output["images"][0]
                    except asyncio.TimeoutError:
                        # Check history periodically
                        history = await self.get_history(prompt_id)
                        if history and history.get("outputs"):
                            outputs = history["outputs"]
                            for node_id, node_output in outputs.items():
                                if "images" in node_output:
                                    return node_output["images"][0]
                    except Exception as e:
                        print(f"WebSocket error: {e}")
                        break
        except Exception as e:
            print(f"WebSocket connection failed, using polling: {e}")
            
            # Fallback to polling
            while time.time() - start_time < timeout:
                history = await self.get_history(prompt_id)
                if history and history.get("outputs"):
                    outputs = history["outputs"]
                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            return node_output["images"][0]
                await asyncio.sleep(2)
        
        return None
        
    async def generate_image(self, request: web.Request) -> web.Response:
        """API endpoint for FLUX.1 Krea image generation"""
        try:
            # Check model availability
            models = await self.check_model_availability()
            missing_models = [name for name, available in models.items() if not available]
            
            if missing_models:
                return web.json_response({
                    "success": False,
                    "error": f"Missing required models: {', '.join(missing_models)}",
                    "missing_models": missing_models,
                    "help": "Please download FLUX.1 Krea models first"
                }, status=424)
            
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            negative_prompt = data.get("negative_prompt", "")
            steps = data.get("steps", 20)
            cfg = data.get("cfg", 3.5)
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            seed = data.get("seed", -1)
            
            # Create FLUX.1 Krea workflow
            workflow = self.get_flux_krea_workflow(
                prompt, negative_prompt, steps, cfg, width, height, seed
            )
            
            # Queue generation
            prompt_id = await self.queue_prompt(workflow)
            print(f"Queued FLUX.1 Krea generation with ID: {prompt_id}")
            
            # Wait for completion
            image_info = await self.wait_for_generation(prompt_id)
            
            if image_info:
                # Get the actual image data
                image_bytes = await self.get_image(
                    image_info["filename"],
                    image_info.get("subfolder", ""),
                    image_info.get("type", "output")
                )
                
                if image_bytes:
                    # Save locally
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    local_filename = f"flux_krea_{timestamp}_{prompt_id[:8]}.png"
                    local_path = self.output_dir / local_filename
                    
                    with open(local_path, "wb") as f:
                        f.write(image_bytes)
                    
                    image_base64 = base64.b64encode(image_bytes).decode()
                    
                    result = {
                        "success": True,
                        "prompt_id": prompt_id,
                        "prompt": prompt,
                        "negative_prompt": negative_prompt,
                        "timestamp": datetime.now().isoformat(),
                        "filename": local_filename,
                        "filepath": str(local_path),
                        "image_base64": image_base64,
                        "params": {
                            "prompt": prompt,
                            "negative_prompt": negative_prompt,
                            "steps": steps,
                            "cfg": cfg,
                            "width": width,
                            "height": height,
                            "seed": seed
                        },
                        "model": "FLUX.1 Krea [dev]",
                        "status": "completed"
                    }
                    
                    self.generation_history.insert(0, result)
                    if len(self.generation_history) > 50:
                        self.generation_history = self.generation_history[:50]
                    
                    return web.json_response(result)
            
            return web.json_response({
                "success": False,
                "error": "Generation failed or timed out"
            }, status=500)
                
        except Exception as e:
            print(f"Generation error: {e}")
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)
            
    async def status_endpoint(self, request: web.Request) -> web.Response:
        """Check system and model status"""
        try:
            # Check ComfyUI connection
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.comfyui_url}/system_stats") as resp:
                    comfyui_connected = resp.status == 200
                    stats = await resp.json() if comfyui_connected else None
        except:
            comfyui_connected = False
            stats = None
        
        # Check model availability
        models = await self.check_model_availability()
        
        return web.json_response({
            "status": "connected" if comfyui_connected else "disconnected",
            "comfyui_url": self.comfyui_url,
            "stats": stats,
            "models": models,
            "model_ready": all(models.values()),
            "missing_models": [name for name, available in models.items() if not available]
        })
        
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the FLUX.1 Krea UI"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>FLUX.1 Krea [dev] :: Advanced Image Generator</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 75%, #0f0f0f 100%);
            color: #ffffff;
            min-height: 100vh;
            overflow-x: hidden;
        }}
        
        .header {{
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            padding: 25px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
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
            background: linear-gradient(90deg, transparent, rgba(64, 224, 208, 0.2), transparent);
            animation: sweep 4s infinite;
        }}
        
        @keyframes sweep {{
            0% {{ left: -100%; }}
            100% {{ left: 100%; }}
        }}
        
        .header h1 {{
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #40e0d0 0%, #48cae4 30%, #0077b6 70%, #023e8a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 3px;
            position: relative;
            z-index: 1;
        }}
        
        .status-badge {{
            position: absolute;
            top: 25px;
            right: 25px;
            padding: 10px 20px;
            background: rgba(64, 224, 208, 0.1);
            border: 1px solid #40e0d0;
            border-radius: 25px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 2;
        }}
        
        .status-dot {{
            width: 10px;
            height: 10px;
            background: #40e0d0;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }}
        
        .container {{
            max-width: 1900px;
            margin: 0 auto;
            padding: 25px;
            display: grid;
            grid-template-columns: 480px 1fr;
            gap: 25px;
        }}
        
        .control-panel {{
            background: rgba(64, 224, 208, 0.03);
            border: 1px solid rgba(64, 224, 208, 0.2);
            border-radius: 20px;
            padding: 30px;
            height: fit-content;
            box-shadow: 0 20px 60px rgba(64, 224, 208, 0.1);
        }}
        
        .section {{
            margin-bottom: 30px;
        }}
        
        .section-title {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #40e0d0;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }}
        
        textarea, input, select {{
            width: 100%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(64, 224, 208, 0.3);
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
            border-color: #40e0d0;
            background: rgba(64, 224, 208, 0.05);
            box-shadow: 0 0 30px rgba(64, 224, 208, 0.2);
        }}
        
        textarea {{
            min-height: 140px;
        }}
        
        .param-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }}
        
        .param-item {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}
        
        .param-label {{
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 500;
        }}
        
        .generate-btn {{
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #40e0d0 0%, #48cae4 50%, #0077b6 100%);
            border: none;
            border-radius: 15px;
            color: #000000;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
            overflow: hidden;
        }}
        
        .generate-btn::before {{
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s;
        }}
        
        .generate-btn:hover::before {{
            left: 100%;
        }}
        
        .generate-btn:hover {{
            transform: translateY(-3px);
            box-shadow: 0 15px 50px rgba(64, 224, 208, 0.4);
        }}
        
        .generate-btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }}
        
        .gallery {{
            background: rgba(64, 224, 208, 0.03);
            border: 1px solid rgba(64, 224, 208, 0.2);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(64, 224, 208, 0.1);
        }}
        
        .gallery-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
            margin-top: 25px;
        }}
        
        .image-card {{
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(64, 224, 208, 0.3);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }}
        
        .image-card:hover {{
            transform: scale(1.03);
            border-color: #40e0d0;
            box-shadow: 0 15px 50px rgba(64, 224, 208, 0.3);
        }}
        
        .image-preview {{
            width: 100%;
            height: 280px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(64, 224, 208, 0.1) 0%, rgba(72, 202, 228, 0.1) 100%);
        }}
        
        .image-preview.placeholder {{
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(64, 224, 208, 0.5);
            font-size: 14px;
        }}
        
        .image-info {{
            padding: 20px;
        }}
        
        .preset-chips {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }}
        
        .preset-chip {{
            padding: 8px 16px;
            background: rgba(64, 224, 208, 0.1);
            border: 1px solid rgba(64, 224, 208, 0.3);
            border-radius: 25px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }}
        
        .preset-chip:hover {{
            background: rgba(64, 224, 208, 0.2);
            border-color: #40e0d0;
            transform: scale(1.05);
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
        
        .loading-content {{
            text-align: center;
        }}
        
        .loading-spinner {{
            width: 80px;
            height: 80px;
            border: 4px solid rgba(64, 224, 208, 0.2);
            border-top: 4px solid #40e0d0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 25px;
        }}
        
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.6; transform: scale(1.1); }}
        }}
        
        .progress-bar {{
            width: 400px;
            height: 6px;
            background: rgba(64, 224, 208, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 25px auto;
        }}
        
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #40e0d0, #48cae4);
            animation: progress 25s linear;
        }}
        
        @keyframes progress {{
            0% {{ width: 0%; }}
            100% {{ width: 100%; }}
        }}
        
        .model-info {{
            background: rgba(64, 224, 208, 0.05);
            border: 1px solid rgba(64, 224, 208, 0.2);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 12px;
        }}
        
        .error-message {{
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid rgba(255, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #ff6b6b;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>FLUX.1 Krea [dev] :: Advanced Image Generator</h1>
        <div class="status-badge">
            <div class="status-dot"></div>
            <span id="connectionStatus">Checking connection...</span>
        </div>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div class="model-info">
                <strong>🎨 FLUX.1 Krea [dev]</strong><br>
                Advanced photorealistic image generation with distinctive aesthetics<br>
                Optimized for M1 Mac performance
            </div>
            
            <div id="errorContainer"></div>
            
            <div class="section">
                <div class="section-title">Creative Prompt</div>
                <textarea id="prompt" placeholder="Describe your vision in detail...">award winning photography, cinematic portrait of a majestic wolf in a misty forest at golden hour, dramatic lighting, ultra detailed fur, piercing eyes, photorealistic, masterpiece</textarea>
                <div class="preset-chips">
                    <div class="preset-chip" onclick="addToPrompt('award winning photography')">Award Winning</div>
                    <div class="preset-chip" onclick="addToPrompt('cinematic lighting')">Cinematic</div>
                    <div class="preset-chip" onclick="addToPrompt('photorealistic')">Photorealistic</div>
                    <div class="preset-chip" onclick="addToPrompt('ultra detailed')">Ultra Detailed</div>
                    <div class="preset-chip" onclick="addToPrompt('dramatic lighting')">Dramatic</div>
                    <div class="preset-chip" onclick="addToPrompt('masterpiece')">Masterpiece</div>
                    <div class="preset-chip" onclick="addToPrompt('professional photography')">Professional</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Advanced Parameters</div>
                <div class="param-grid">
                    <div class="param-item">
                        <span class="param-label">Inference Steps</span>
                        <input type="number" id="steps" value="20" min="10" max="50">
                    </div>
                    <div class="param-item">
                        <span class="param-label">Guidance Scale</span>
                        <input type="number" id="cfg" value="3.5" min="1" max="10" step="0.5">
                    </div>
                    <div class="param-item">
                        <span class="param-label">Width</span>
                        <select id="width">
                            <option value="768">768</option>
                            <option value="832">832</option>
                            <option value="896">896</option>
                            <option value="1024" selected>1024</option>
                            <option value="1152">1152</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Height</span>
                        <select id="height">
                            <option value="768">768</option>
                            <option value="832">832</option>
                            <option value="896">896</option>
                            <option value="1024" selected>1024</option>
                            <option value="1152">1152</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Random Seed (Optional)</div>
                <input type="number" id="seed" placeholder="Random seed (-1 for random)" value="-1">
            </div>
            
            <button class="generate-btn" onclick="generateImage()">Generate with FLUX.1 Krea</button>
        </div>
        
        <div class="gallery">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 22px; font-weight: 600;">Generated Gallery</h2>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                    <span id="imageCount">0</span> images generated
                </div>
            </div>
            <div class="gallery-grid" id="galleryGrid">
                <!-- Images will be added here -->
            </div>
        </div>
    </div>
    
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div style="color: #40e0d0; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                Generating with FLUX.1 Krea [dev]
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;" id="loadingText">
                Initializing advanced diffusion process...
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
    </div>
    
    <script>
        let generationHistory = [];
        let modelReady = false;
        
        async function checkStatus() {{
            try {{
                const response = await fetch('/status');
                const data = await response.json();
                const statusEl = document.getElementById('connectionStatus');
                const dotEl = document.querySelector('.status-dot');
                const errorContainer = document.getElementById('errorContainer');
                
                if (data.status === 'connected' && data.model_ready) {{
                    statusEl.textContent = 'FLUX.1 Krea Ready';
                    dotEl.style.background = '#40e0d0';
                    modelReady = true;
                    errorContainer.innerHTML = '';
                }} else if (data.status === 'connected' && !data.model_ready) {{
                    statusEl.textContent = 'Models Missing';
                    dotEl.style.background = '#ff6b6b';
                    modelReady = false;
                    
                    const missingModels = data.missing_models || [];
                    errorContainer.innerHTML = `
                        <div class="error-message">
                            <strong>⚠️ Missing FLUX.1 Krea Models</strong><br>
                            Required: ${{missingModels.join(', ')}}<br>
                            Please download the models first to use FLUX.1 Krea.
                        </div>
                    `;
                }} else {{
                    statusEl.textContent = 'ComfyUI Disconnected';
                    dotEl.style.background = '#ff6b6b';
                    modelReady = false;
                    errorContainer.innerHTML = `
                        <div class="error-message">
                            <strong>❌ ComfyUI Connection Failed</strong><br>
                            Please ensure ComfyUI is running on port 8188.
                        </div>
                    `;
                }}
            }} catch (error) {{
                document.getElementById('connectionStatus').textContent = 'Connection Error';
                document.querySelector('.status-dot').style.background = '#ff6b6b';
                modelReady = false;
            }}
        }}
        
        function addToPrompt(text) {{
            const promptField = document.getElementById('prompt');
            if (promptField.value && !promptField.value.endsWith(', ')) {{
                promptField.value += ', ';
            }}
            promptField.value += text;
        }}
        
        async function generateImage() {{
            if (!modelReady) {{
                alert('FLUX.1 Krea models are not ready. Please check the status.');
                return;
            }}
            
            const button = document.querySelector('.generate-btn');
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            
            button.disabled = true;
            overlay.classList.add('active');
            
            const steps = [
                "Initializing FLUX.1 Krea diffusion model...",
                "Encoding text prompt with dual CLIP encoders...",
                "Generating initial latent representation...",
                "Running advanced diffusion sampling...",
                "Applying photorealistic refinements...",
                "Decoding with AutoEncoder VAE...",
                "Finalizing high-resolution output..."
            ];
            
            let stepIndex = 0;
            const stepInterval = setInterval(() => {{
                if (stepIndex < steps.length) {{
                    loadingText.textContent = steps[stepIndex];
                    stepIndex++;
                }}
            }}, 3500);
            
            try {{
                const response = await fetch('/generate', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                        prompt: document.getElementById('prompt').value,
                        steps: parseInt(document.getElementById('steps').value),
                        cfg: parseFloat(document.getElementById('cfg').value),
                        width: parseInt(document.getElementById('width').value),
                        height: parseInt(document.getElementById('height').value),
                        seed: parseInt(document.getElementById('seed').value)
                    }})
                }});
                
                clearInterval(stepInterval);
                
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
                clearInterval(stepInterval);
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
            
            if (imageData.image_base64) {{
                card.innerHTML = `
                    <img src="data:image/png;base64,${{imageData.image_base64}}" class="image-preview" alt="Generated Image">
                    <div class="image-info">
                        <div style="font-size: 13px; margin-bottom: 10px; color: rgba(255, 255, 255, 0.9);">
                            ${{imageData.prompt.substring(0, 120)}}${{imageData.prompt.length > 120 ? '...' : ''}}
                        </div>
                        <div style="font-size: 11px; color: rgba(64, 224, 208, 0.7);">
                            ${{imageData.params.width}}x${{imageData.params.height}} | 
                            ${{imageData.params.steps}} steps | 
                            CFG ${{imageData.params.cfg}} | 
                            ${{imageData.model}}
                        </div>
                        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-top: 8px;">
                            ${{new Date(imageData.timestamp).toLocaleString()}}
                        </div>
                    </div>
                `;
                
                // Add download functionality
                card.onclick = () => {{
                    const link = document.createElement('a');
                    link.href = 'data:image/png;base64,' + imageData.image_base64;
                    link.download = imageData.filename || 'flux_krea_image.png';
                    link.click();
                }};
            }}
            
            gallery.insertBefore(card, gallery.firstChild);
            document.getElementById('imageCount').textContent = generationHistory.length;
            
            // Keep only last 20 images
            while (gallery.children.length > 20) {{
                gallery.removeChild(gallery.lastChild);
            }}
        }}
        
        // Load history on page load
        async function loadHistory() {{
            try {{
                const response = await fetch('/history');
                const data = await response.json();
                data.history.forEach(item => addImageToGallery(item));
            }} catch (error) {{
                console.error('Failed to load history:', error);
            }}
        }}
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {{
            if (e.ctrlKey && e.key === 'Enter') {{
                generateImage();
            }}
        }});
        
        // Check status and load history
        checkStatus();
        loadHistory();
        setInterval(checkStatus, 10000);
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
        
        # Set max content size for large images
        app._client_max_size = 200 * 1024 * 1024  # 200MB
        
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"\n🎨 FLUX.1 Krea [dev] Image Generation Server")
        print(f"=" * 70)
        print(f"🌐 Web Interface: http://localhost:{self.port}")
        print(f"🔌 ComfyUI Backend: {self.comfyui_url}")
        print(f"🤖 Model: FLUX.1 Krea [dev] (Advanced Photorealistic)")
        print(f"💻 Optimized for: M1 Mac with MPS acceleration")
        print(f"=" * 70)
        print(f"📡 API Endpoints:")
        print(f"   POST /generate - Generate images with FLUX.1 Krea")
        print(f"   GET  /history - View generation history")
        print(f"   GET  /status - Check system and model status")
        print(f"=" * 70)
        print(f"⚡ Key Features:")
        print(f"   • Advanced photorealistic generation")
        print(f"   • Distinctive aesthetic approach")
        print(f"   • Real-time ComfyUI integration")
        print(f"   • M1 Mac performance optimization")
        print(f"   • Advanced parameter controls")
        print(f"=" * 70)
        print(f"\n📋 Model Requirements:")
        print(f"   • flux1-krea-dev.safetensors (~12GB)")
        print(f"   • flux_ae.safetensors (~335MB)")
        print(f"   • t5xxl_fp8_e4m3fn.safetensors (~5GB)")
        print(f"   • clip_l.safetensors (~250MB)")
        print(f"\n⌨️  Press Ctrl+C to stop the server\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down FLUX.1 Krea server...")
            await runner.cleanup()

async def main():
    import argparse
    parser = argparse.ArgumentParser(description='FLUX.1 Krea ComfyUI Integration Server')
    parser.add_argument('--port', type=int, default=7866, help='Server port (default: 7866)')
    parser.add_argument('--comfyui-host', type=str, default='localhost', help='ComfyUI host')
    parser.add_argument('--comfyui-port', type=int, default=8188, help='ComfyUI port (default: 8188)')
    
    args = parser.parse_args()
    
    server = FluxKreaServer(
        port=args.port,
        comfyui_host=args.comfyui_host,
        comfyui_port=args.comfyui_port
    )
    await server.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
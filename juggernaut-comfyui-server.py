#!/usr/bin/env python3
"""
Real Juggernaut XL Image Generation Server with ComfyUI Integration
Connects to existing ComfyUI instance and uses actual Juggernaut model
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
import io
from PIL import Image

class JuggernautComfyUIServer:
    def __init__(self, port: int = 7866, comfyui_host: str = "localhost", comfyui_port: int = 8188):
        self.port = port
        self.comfyui_host = comfyui_host
        self.comfyui_port = comfyui_port
        self.comfyui_url = f"http://{comfyui_host}:{comfyui_port}"
        self.generation_history = []
        self.output_dir = Path("./output/juggernaut")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client_id = str(uuid.uuid4())
        
    def get_juggernaut_workflow(self, prompt: str, negative_prompt: str = "", 
                               steps: int = 25, cfg: float = 7.5,
                               width: int = 1024, height: int = 1024,
                               seed: int = -1, sampler: str = "dpmpp_2m_karras") -> dict:
        """Create workflow for Juggernaut XL model"""
        
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)
            
        workflow = {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": sampler.replace("_karras", ""),
                    "scheduler": "karras" if "karras" in sampler else "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler",
                "_meta": {
                    "title": "KSampler"
                }
            },
            "4": {
                "inputs": {
                    "ckpt_name": "juggernautXL_v9.safetensors"
                },
                "class_type": "CheckpointLoaderSimple",
                "_meta": {
                    "title": "Load Checkpoint"
                }
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage",
                "_meta": {
                    "title": "Empty Latent Image"
                }
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP Text Encode (Prompt)"
                }
            },
            "7": {
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP Text Encode (Negative)"
                }
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode",
                "_meta": {
                    "title": "VAE Decode"
                }
            },
            "9": {
                "inputs": {
                    "filename_prefix": f"juggernaut_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage",
                "_meta": {
                    "title": "Save Image"
                }
            }
        }
        
        return workflow
        
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
        
    async def wait_for_generation(self, prompt_id: str, timeout: int = 120) -> Optional[Dict]:
        """Wait for generation to complete using WebSocket updates"""
        start_time = time.time()
        
        # Connect to WebSocket for real-time updates
        ws_url = f"ws://{self.comfyui_host}:{self.comfyui_port}/ws?clientId={self.client_id}"
        
        try:
            async with websockets.connect(ws_url) as websocket:
                while time.time() - start_time < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        # Check if this is our prompt completion
                        if data.get('type') == 'executed' and data.get('data', {}).get('prompt_id') == prompt_id:
                            # Get the output from history
                            history = await self.get_history(prompt_id)
                            if history and history.get("outputs"):
                                outputs = history["outputs"]
                                for node_id, node_output in outputs.items():
                                    if "images" in node_output:
                                        image_data = node_output["images"][0]
                                        return image_data
                    except asyncio.TimeoutError:
                        # Check history periodically even without WebSocket updates
                        history = await self.get_history(prompt_id)
                        if history and history.get("outputs"):
                            outputs = history["outputs"]
                            for node_id, node_output in outputs.items():
                                if "images" in node_output:
                                    image_data = node_output["images"][0]
                                    return image_data
                    except Exception as e:
                        print(f"WebSocket error: {e}")
                        break
        except Exception as e:
            print(f"Failed to connect to WebSocket, falling back to polling: {e}")
            
            # Fallback to polling
            while time.time() - start_time < timeout:
                history = await self.get_history(prompt_id)
                if history and history.get("outputs"):
                    outputs = history["outputs"]
                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            image_data = node_output["images"][0]
                            return image_data
                await asyncio.sleep(1)
        
        return None
        
    async def generate_image(self, request: web.Request) -> web.Response:
        """API endpoint for real image generation"""
        try:
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            negative_prompt = data.get("negative_prompt", "blurry, low quality, distorted, ugly")
            steps = data.get("steps", 25)
            cfg = data.get("cfg", 7.5)
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            seed = data.get("seed", -1)
            sampler = data.get("sampler", "dpmpp_2m_karras")
            
            # Create workflow
            workflow = self.get_juggernaut_workflow(
                prompt, negative_prompt, steps, cfg, width, height, seed, sampler
            )
            
            # Queue generation
            prompt_id = await self.queue_prompt(workflow)
            print(f"Queued generation with ID: {prompt_id}")
            
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
                    # Save locally and encode
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    local_filename = f"juggernaut_{timestamp}_{prompt_id[:8]}.png"
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
                            "seed": seed,
                            "sampler": sampler
                        },
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
            
    async def batch_generate(self, request: web.Request) -> web.Response:
        """Batch generation endpoint"""
        try:
            data = await request.json()
            prompts = data.get('prompts', [])
            base_params = data.get('params', {})
            
            results = []
            for prompt in prompts:
                # Create individual request
                single_request = base_params.copy()
                single_request['prompt'] = prompt
                
                # Create mock request object
                mock_request = type('Request', (), {
                    'json': lambda: asyncio.coroutine(lambda: single_request)()
                })()
                
                # Generate image
                response = await self.generate_image(mock_request)
                result_data = json.loads(response.text)
                results.append(result_data)
                
                # Small delay between generations
                await asyncio.sleep(0.5)
            
            return web.json_response({"results": results})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
            
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def status_endpoint(self, request: web.Request) -> web.Response:
        """Check ComfyUI connection status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.comfyui_url}/system_stats") as resp:
                    if resp.status == 200:
                        stats = await resp.json()
                        return web.json_response({
                            "status": "connected",
                            "comfyui_url": self.comfyui_url,
                            "stats": stats
                        })
        except:
            pass
        
        return web.json_response({
            "status": "disconnected",
            "comfyui_url": self.comfyui_url
        }, status=503)
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the enhanced UI"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>JUGGERNAUT XL v9 :: REAL IMAGE GENERATOR</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0f2e 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-bottom: 2px solid rgba(138, 43, 226, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.3), transparent);
            animation: sweep 3s infinite;
        }
        
        @keyframes sweep {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #8b2be2 0%, #ff00ff 50%, #00ffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .status-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 450px 1fr;
            gap: 20px;
        }
        
        .control-panel {
            background: rgba(138, 43, 226, 0.05);
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 16px;
            padding: 25px;
            height: fit-content;
            box-shadow: 0 8px 32px rgba(138, 43, 226, 0.2);
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #8b2be2;
            margin-bottom: 12px;
            letter-spacing: 1.5px;
        }
        
        textarea, input, select {
            width: 100%;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(138, 43, 226, 0.3);
            color: #ffffff;
            padding: 12px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        textarea:focus, input:focus, select:focus {
            outline: none;
            border-color: #8b2be2;
            background: rgba(138, 43, 226, 0.1);
            box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
        }
        
        textarea {
            min-height: 120px;
            resize: vertical;
        }
        
        .param-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        
        .param-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .param-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .generate-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #8b2be2 0%, #ff00ff 100%);
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            position: relative;
            overflow: hidden;
        }
        
        .generate-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }
        
        .generate-btn:hover::before {
            left: 100%;
        }
        
        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(138, 43, 226, 0.5);
        }
        
        .generate-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .gallery {
            background: rgba(138, 43, 226, 0.05);
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(138, 43, 226, 0.2);
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .image-card {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .image-card:hover {
            transform: scale(1.02);
            border-color: #8b2be2;
            box-shadow: 0 8px 32px rgba(138, 43, 226, 0.4);
        }
        
        .image-preview {
            width: 100%;
            height: 250px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%);
        }
        
        .image-preview.placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(138, 43, 226, 0.5);
            font-size: 14px;
        }
        
        .image-info {
            padding: 15px;
        }
        
        .preset-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .preset-chip {
            padding: 6px 14px;
            background: rgba(138, 43, 226, 0.2);
            border: 1px solid rgba(138, 43, 226, 0.4);
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .preset-chip:hover {
            background: rgba(138, 43, 226, 0.4);
            border-color: #8b2be2;
            transform: scale(1.05);
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        
        .loading-overlay.active {
            display: flex;
        }
        
        .loading-content {
            text-align: center;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(138, 43, 226, 0.2);
            border-top: 3px solid #8b2be2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .progress-bar {
            width: 300px;
            height: 4px;
            background: rgba(138, 43, 226, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin: 20px auto;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b2be2, #ff00ff);
            animation: progress 30s linear;
        }
        
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>JUGGERNAUT XL v9 :: REAL IMAGE GENERATOR</h1>
        <div class="status-badge">
            <div class="status-dot"></div>
            <span id="connectionStatus">Connected to ComfyUI</span>
        </div>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div class="section">
                <div class="section-title">Prompt Engineering</div>
                <textarea id="prompt" placeholder="Describe your masterpiece...">award winning photography, cinematic shot of a majestic dragon soaring through clouds at golden hour, dramatic lighting, ultra detailed scales, 8k resolution, photorealistic, masterpiece</textarea>
                <div class="preset-chips">
                    <div class="preset-chip" onclick="addToPrompt('award winning')">Award Winning</div>
                    <div class="preset-chip" onclick="addToPrompt('cinematic lighting')">Cinematic</div>
                    <div class="preset-chip" onclick="addToPrompt('ultra detailed')">Ultra Detailed</div>
                    <div class="preset-chip" onclick="addToPrompt('8k resolution')">8K</div>
                    <div class="preset-chip" onclick="addToPrompt('photorealistic')">Photorealistic</div>
                    <div class="preset-chip" onclick="addToPrompt('masterpiece')">Masterpiece</div>
                    <div class="preset-chip" onclick="addToPrompt('trending on artstation')">Trending</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Negative Prompt</div>
                <textarea id="negative" placeholder="What to avoid...">blurry, low quality, distorted, ugly, bad anatomy, wrong proportions, extra limbs, cloned face, mutated hands, poorly drawn hands, extra fingers</textarea>
            </div>
            
            <div class="section">
                <div class="section-title">Generation Parameters</div>
                <div class="param-grid">
                    <div class="param-item">
                        <span class="param-label">Steps</span>
                        <input type="number" id="steps" value="25" min="10" max="150">
                    </div>
                    <div class="param-item">
                        <span class="param-label">CFG Scale</span>
                        <input type="number" id="cfg" value="7.5" min="1" max="20" step="0.5">
                    </div>
                    <div class="param-item">
                        <span class="param-label">Width</span>
                        <select id="width">
                            <option value="512">512</option>
                            <option value="768">768</option>
                            <option value="896">896</option>
                            <option value="1024" selected>1024</option>
                            <option value="1152">1152</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Height</span>
                        <select id="height">
                            <option value="512">512</option>
                            <option value="768">768</option>
                            <option value="896">896</option>
                            <option value="1024" selected>1024</option>
                            <option value="1152">1152</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Sampler Configuration</div>
                <select id="sampler">
                    <option value="dpmpp_2m_karras" selected>DPM++ 2M Karras (Recommended)</option>
                    <option value="dpmpp_sde_karras">DPM++ SDE Karras</option>
                    <option value="dpmpp_2m">DPM++ 2M</option>
                    <option value="euler_a">Euler A</option>
                    <option value="euler">Euler</option>
                    <option value="ddim">DDIM</option>
                    <option value="uni_pc">UniPC</option>
                </select>
            </div>
            
            <div class="section">
                <div class="section-title">Seed (Optional)</div>
                <input type="number" id="seed" placeholder="Random seed (-1 for random)" value="-1">
            </div>
            
            <button class="generate-btn" onclick="generateImage()">GENERATE IMAGE</button>
        </div>
        
        <div class="gallery">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 20px; font-weight: 600;">Generated Images</h2>
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
            <div style="color: #8b2be2; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                Generating with Juggernaut XL v9
            </div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 14px;" id="loadingText">
                Processing your prompt...
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
    </div>
    
    <script>
        let generationHistory = [];
        
        async function checkConnection() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                const statusEl = document.getElementById('connectionStatus');
                const dotEl = document.querySelector('.status-dot');
                
                if (data.status === 'connected') {
                    statusEl.textContent = 'Connected to ComfyUI';
                    dotEl.style.background = '#00ff00';
                } else {
                    statusEl.textContent = 'Disconnected';
                    dotEl.style.background = '#ff0000';
                }
            } catch (error) {
                document.getElementById('connectionStatus').textContent = 'Connection Error';
                document.querySelector('.status-dot').style.background = '#ff0000';
            }
        }
        
        function addToPrompt(text) {
            const promptField = document.getElementById('prompt');
            if (promptField.value && !promptField.value.endsWith(', ')) {
                promptField.value += ', ';
            }
            promptField.value += text;
        }
        
        async function generateImage() {
            const button = document.querySelector('.generate-btn');
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            
            button.disabled = true;
            overlay.classList.add('active');
            
            const steps = [
                "Initializing Juggernaut XL v9...",
                "Processing prompt through CLIP encoder...",
                "Generating latent space...",
                "Running diffusion process...",
                "Denoising image...",
                "Applying VAE decoder...",
                "Finalizing image..."
            ];
            
            let stepIndex = 0;
            const stepInterval = setInterval(() => {
                if (stepIndex < steps.length) {
                    loadingText.textContent = steps[stepIndex];
                    stepIndex++;
                }
            }, 3000);
            
            try {
                const response = await fetch('/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        prompt: document.getElementById('prompt').value,
                        negative_prompt: document.getElementById('negative').value,
                        steps: parseInt(document.getElementById('steps').value),
                        cfg: parseFloat(document.getElementById('cfg').value),
                        width: parseInt(document.getElementById('width').value),
                        height: parseInt(document.getElementById('height').value),
                        seed: parseInt(document.getElementById('seed').value),
                        sampler: document.getElementById('sampler').value
                    })
                });
                
                clearInterval(stepInterval);
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        addImageToGallery(result);
                    } else {
                        alert('Generation failed: ' + result.error);
                    }
                } else {
                    const error = await response.json();
                    alert('Error: ' + error.error);
                }
            } catch (error) {
                clearInterval(stepInterval);
                console.error('Error:', error);
                alert('Failed to generate image: ' + error.message);
            } finally {
                button.disabled = false;
                overlay.classList.remove('active');
            }
        }
        
        function addImageToGallery(imageData) {
            generationHistory.unshift(imageData);
            const gallery = document.getElementById('galleryGrid');
            
            const card = document.createElement('div');
            card.className = 'image-card';
            
            if (imageData.image_base64) {
                card.innerHTML = `
                    <img src="data:image/png;base64,${imageData.image_base64}" class="image-preview" alt="Generated Image">
                    <div class="image-info">
                        <div style="font-size: 13px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.9);">
                            ${imageData.prompt.substring(0, 100)}${imageData.prompt.length > 100 ? '...' : ''}
                        </div>
                        <div style="font-size: 11px; color: rgba(138, 43, 226, 0.7);">
                            ${imageData.params.width}x${imageData.params.height} | 
                            ${imageData.params.steps} steps | 
                            CFG ${imageData.params.cfg}
                        </div>
                        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-top: 5px;">
                            ${new Date(imageData.timestamp).toLocaleString()}
                        </div>
                    </div>
                `;
                
                // Add click handler to download
                card.onclick = () => {
                    const link = document.createElement('a');
                    link.href = 'data:image/png;base64,' + imageData.image_base64;
                    link.download = imageData.filename || 'juggernaut_image.png';
                    link.click();
                };
            } else {
                card.innerHTML = `
                    <div class="image-preview placeholder">
                        Generating...
                    </div>
                    <div class="image-info">
                        <div style="font-size: 13px;">${imageData.prompt.substring(0, 100)}</div>
                    </div>
                `;
            }
            
            gallery.insertBefore(card, gallery.firstChild);
            document.getElementById('imageCount').textContent = generationHistory.length;
            
            // Keep only last 20 images
            while (gallery.children.length > 20) {
                gallery.removeChild(gallery.lastChild);
            }
        }
        
        // Load history on page load
        async function loadHistory() {
            try {
                const response = await fetch('/history');
                const data = await response.json();
                data.history.forEach(item => addImageToGallery(item));
            } catch (error) {
                console.error('Failed to load history:', error);
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                generateImage();
            }
        });
        
        // Check connection status
        checkConnection();
        setInterval(checkConnection, 5000);
        
        // Load history
        loadHistory();
    </script>
</body>
</html>
        """
        return web.Response(text=html, content_type='text/html')
        
    def create_app(self) -> web.Application:
        """Create the web application"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_image)
        app.router.add_post('/batch', self.batch_generate)
        app.router.add_get('/history', self.history_endpoint)
        app.router.add_get('/status', self.status_endpoint)
        app.router.add_get('/', self.index_page)
        
        # Set max content size for large images
        app._client_max_size = 100 * 1024 * 1024  # 100MB
        
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"\n🚀 Juggernaut XL v9 Real Image Generation Server")
        print(f"=" * 60)
        print(f"🎨 Web Interface: http://localhost:{self.port}")
        print(f"🔌 ComfyUI Backend: {self.comfyui_url}")
        print(f"📍 Model: juggernautXL_v9.safetensors")
        print(f"=" * 60)
        print(f"📡 API Endpoints:")
        print(f"   POST /generate - Generate single image")
        print(f"   POST /batch - Batch generation")
        print(f"   GET  /history - View generation history")
        print(f"   GET  /status - Check ComfyUI connection")
        print(f"=" * 60)
        print(f"⚡ Features:")
        print(f"   • Real Juggernaut XL v9 model")
        print(f"   • Live ComfyUI integration")
        print(f"   • WebSocket progress updates")
        print(f"   • High-resolution support (up to 1280px)")
        print(f"   • Multiple samplers available")
        print(f"=" * 60)
        print(f"\n⌨️  Press Ctrl+C to stop the server\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            await runner.cleanup()

async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Juggernaut XL ComfyUI Integration Server')
    parser.add_argument('--port', type=int, default=7866, help='Server port (default: 7866)')
    parser.add_argument('--comfyui-host', type=str, default='localhost', help='ComfyUI host')
    parser.add_argument('--comfyui-port', type=int, default=8188, help='ComfyUI port (default: 8188)')
    
    args = parser.parse_args()
    
    # Check for required packages
    try:
        import websockets
        from PIL import Image
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "pillow"])
        print("Packages installed. Please restart the script.")
        sys.exit(0)
    
    server = JuggernautComfyUIServer(
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
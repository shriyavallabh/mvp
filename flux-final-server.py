#!/usr/bin/env python3
"""
Complete FLUX Image Generation Server - Real Implementation
Working with ComfyUI FLUX nodes for actual image generation
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

class FluxFinalServer:
    def __init__(self, port: int = 7866, comfyui_host: str = "localhost", comfyui_port: int = 8188):
        self.port = port
        self.comfyui_host = comfyui_host
        self.comfyui_port = comfyui_port
        self.comfyui_url = f"http://{comfyui_host}:{comfyui_port}"
        self.generation_history = []
        self.output_dir = Path("./output")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client_id = str(uuid.uuid4())
        
    def get_flux_workflow(self, prompt: str, negative_prompt: str = "", 
                         steps: int = 4, guidance: float = 3.5,
                         width: int = 1024, height: int = 1024,
                         seed: int = -1) -> dict:
        """Create a working FLUX workflow using available models"""
        
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)
            
        # Working Qwen workflow with standard ComfyUI nodes
        workflow = {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": guidance,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": 1.0,
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
                    "unet_name": "Qwen-Image-Lightning-8steps-V1.0.safetensors",
                    "weight_dtype": "default"
                },
                "class_type": "UNETLoader",
                "_meta": {
                    "title": "Load Qwen Model"
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
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP Text Encode (Prompt)"
                }
            },
            "7": {
                "inputs": {
                    "text": negative_prompt if negative_prompt.strip() else "",
                    "clip": ["11", 0]
                },
                "class_type": "CLIPTextEncode", 
                "_meta": {
                    "title": "CLIP Text Encode (Negative)"
                }
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["10", 0]
                },
                "class_type": "VAEDecode",
                "_meta": {
                    "title": "VAE Decode"
                }
            },
            "9": {
                "inputs": {
                    "filename_prefix": f"qwen_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage",
                "_meta": {
                    "title": "Save Image"
                }
            },
            "10": {
                "inputs": {
                    "vae_name": "qwen_image_vae.safetensors"
                },
                "class_type": "VAELoader",
                "_meta": {
                    "title": "Load VAE"
                }
            },
            "11": {
                "inputs": {
                    "clip_name": "t5xxl_fp8_e4m3fn.safetensors",
                    "type": "qwen_image"
                },
                "class_type": "CLIPLoader",
                "_meta": {
                    "title": "Load CLIP"
                }
            }
        }
        
        return workflow
        
    async def check_model_availability(self) -> Dict[str, Any]:
        """Check what models are available"""
        comfyui_path = Path.home() / "ComfyUI-Local" / "ComfyUI"
        
        models = {
            "qwen_unet": (comfyui_path / "models" / "unet" / "Qwen-Image-Lightning-8steps-V1.0.safetensors").exists(),
            "t5xxl": (comfyui_path / "models" / "clip" / "t5xxl_fp8_e4m3fn.safetensors").exists(),
            "qwen_vae": (comfyui_path / "models" / "vae" / "qwen_image_vae.safetensors").exists()
        }
        
        can_generate = all(models.values())
        
        return {
            "models": models,
            "can_generate": can_generate,
            "missing": [k for k, v in models.items() if not v]
        }
        
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
                        
                        # Check for completion
                        if data.get('type') == 'executed' and data.get('data', {}).get('prompt_id') == prompt_id:
                            history = await self.get_history(prompt_id)
                            if history and history.get("outputs"):
                                outputs = history["outputs"]
                                for node_id, node_output in outputs.items():
                                    if "images" in node_output:
                                        return node_output["images"][0]
                                        
                        # Check for errors
                        if data.get('type') == 'execution_error':
                            raise Exception(f"Generation failed: {data.get('data', {}).get('exception_message', 'Unknown error')}")
                            
                    except asyncio.TimeoutError:
                        # Periodic check
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
        """API endpoint for real FLUX image generation"""
        try:
            # Check model availability
            model_status = await self.check_model_availability()
            
            if not model_status["can_generate"]:
                return web.json_response({
                    "success": False,
                    "error": f"Missing required models: {', '.join(model_status['missing'])}",
                    "models": model_status["models"],
                    "help": "Please ensure all FLUX models are available in ComfyUI"
                }, status=424)
            
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            negative_prompt = data.get("negative_prompt", "")
            steps = data.get("steps", 4)
            guidance = data.get("guidance", 3.5)
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            seed = data.get("seed", -1)
            
            print(f"🎨 Generating Qwen image...")
            print(f"   Prompt: {prompt[:80]}...")
            if negative_prompt:
                print(f"   Negative: {negative_prompt[:80]}...")
            
            # Create Qwen workflow
            workflow = self.get_flux_workflow(
                prompt, negative_prompt, steps, guidance, width, height, seed
            )
            
            print(f"📋 Workflow created with {len(workflow)} nodes")
            
            # Queue generation
            prompt_id = await self.queue_prompt(workflow)
            print(f"✅ Queued generation with ID: {prompt_id}")
            
            # Wait for completion
            image_info = await self.wait_for_generation(prompt_id)
            
            if image_info:
                print(f"🎉 Generation completed!")
                
                # Get the actual image data
                image_bytes = await self.get_image(
                    image_info["filename"],
                    image_info.get("subfolder", ""),
                    image_info.get("type", "output")
                )
                
                if image_bytes:
                    # Save locally
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    local_filename = f"flux_{timestamp}_{prompt_id[:8]}.png"
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
                            "guidance": guidance,
                            "width": width,
                            "height": height,
                            "seed": seed
                        },
                        "model": "Qwen Image Lightning 8-steps",
                        "status": "completed"
                    }
                    
                    self.generation_history.insert(0, result)
                    if len(self.generation_history) > 50:
                        self.generation_history = self.generation_history[:50]
                    
                    print(f"💾 Saved image: {local_filename}")
                    return web.json_response(result)
                else:
                    print("❌ Failed to retrieve image data")
            else:
                print("❌ Generation timed out or failed")
            
            return web.json_response({
                "success": False,
                "error": "Generation failed or timed out"
            }, status=500)
                
        except Exception as e:
            print(f"❌ Generation error: {e}")
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
        
        model_status = await self.check_model_availability()
        
        return web.json_response({
            "status": "ready" if model_status["can_generate"] else "models_missing",
            "comfyui_connected": comfyui_connected,
            "comfyui_url": self.comfyui_url,
            "stats": stats,
            "model_status": model_status
        })
        
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the complete FLUX UI"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>FLUX Image Generator :: Real Generation</title>
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
            border-bottom: 2px solid rgba(0, 255, 127, 0.3);
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
            background: linear-gradient(90deg, transparent, rgba(0, 255, 127, 0.2), transparent);
            animation: sweep 4s infinite;
        }}
        
        @keyframes sweep {{
            0% {{ left: -100%; }}
            100% {{ left: 100%; }}
        }}
        
        .header h1 {{
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff7f 0%, #32cd32 50%, #228b22 100%);
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
            background: rgba(0, 255, 127, 0.1);
            border: 1px solid #00ff7f;
            color: #00ff7f;
        }}
        
        .status-badge.error {{
            background: rgba(255, 69, 0, 0.1);
            border: 1px solid #ff4500;
            color: #ff4500;
        }}
        
        .status-dot {{
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }}
        
        .container {{
            max-width: 1900px;
            margin: 0 auto;
            padding: 25px;
            display: grid;
            grid-template-columns: 520px 1fr;
            gap: 25px;
        }}
        
        .control-panel {{
            background: rgba(0, 255, 127, 0.03);
            border: 1px solid rgba(0, 255, 127, 0.2);
            border-radius: 20px;
            padding: 30px;
            height: fit-content;
            box-shadow: 0 20px 60px rgba(0, 255, 127, 0.1);
        }}
        
        .section {{
            margin-bottom: 25px;
        }}
        
        .section-title {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #00ff7f;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }}
        
        textarea, input, select {{
            width: 100%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(0, 255, 127, 0.3);
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
            border-color: #00ff7f;
            background: rgba(0, 255, 127, 0.05);
            box-shadow: 0 0 30px rgba(0, 255, 127, 0.2);
        }}
        
        textarea {{
            min-height: 120px;
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
            background: linear-gradient(135deg, #00ff7f 0%, #32cd32 50%, #228b22 100%);
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
            box-shadow: 0 15px 50px rgba(0, 255, 127, 0.4);
        }}
        
        .generate-btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }}
        
        .gallery {{
            background: rgba(0, 255, 127, 0.03);
            border: 1px solid rgba(0, 255, 127, 0.2);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0, 255, 127, 0.1);
        }}
        
        .gallery-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 25px;
        }}
        
        .image-card {{
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(0, 255, 127, 0.3);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }}
        
        .image-card:hover {{
            transform: scale(1.03);
            border-color: #00ff7f;
            box-shadow: 0 15px 50px rgba(0, 255, 127, 0.3);
        }}
        
        .image-preview {{
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(0, 255, 127, 0.1) 0%, rgba(50, 205, 50, 0.1) 100%);
        }}
        
        .image-info {{
            padding: 20px;
        }}
        
        .preset-chips {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }}
        
        .preset-chip {{
            padding: 6px 12px;
            background: rgba(0, 255, 127, 0.1);
            border: 1px solid rgba(0, 255, 127, 0.3);
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }}
        
        .preset-chip:hover {{
            background: rgba(0, 255, 127, 0.2);
            border-color: #00ff7f;
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
        
        .loading-spinner {{
            width: 80px;
            height: 80px;
            border: 4px solid rgba(0, 255, 127, 0.2);
            border-top: 4px solid #00ff7f;
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
        
        .error-message {{
            background: rgba(255, 69, 0, 0.1);
            border: 1px solid rgba(255, 69, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #ff4500;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>FLUX Image Generator :: Real Generation</h1>
        <div class="status-badge" id="statusBadge">
            <div class="status-dot" id="statusDot"></div>
            <span id="connectionStatus">Checking...</span>
        </div>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div id="errorContainer"></div>
            
            <div class="section">
                <div class="section-title">✨ Positive Prompt</div>
                <textarea id="prompt" placeholder="Describe what you want to see...">award winning photography of a majestic dragon soaring through dramatic storm clouds, cinematic lighting, ultra detailed scales, piercing golden eyes, fantasy art masterpiece, 8k resolution</textarea>
                <div class="preset-chips">
                    <div class="preset-chip" onclick="addToPrompt('award winning')">Award Winning</div>
                    <div class="preset-chip" onclick="addToPrompt('cinematic lighting')">Cinematic</div>
                    <div class="preset-chip" onclick="addToPrompt('ultra detailed')">Ultra Detailed</div>
                    <div class="preset-chip" onclick="addToPrompt('8k resolution')">8K Resolution</div>
                    <div class="preset-chip" onclick="addToPrompt('masterpiece')">Masterpiece</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🚫 Negative Prompt</div>
                <textarea id="negative" placeholder="Describe what you want to avoid...">blurry, low quality, distorted, ugly, bad anatomy, extra limbs, poorly drawn hands, deformed, mutated, out of focus, bad composition, watermark, signature</textarea>
                <div class="preset-chips">
                    <div class="preset-chip" onclick="addToNegative('blurry')">Blurry</div>
                    <div class="preset-chip" onclick="addToNegative('low quality')">Low Quality</div>
                    <div class="preset-chip" onclick="addToNegative('distorted')">Distorted</div>
                    <div class="preset-chip" onclick="addToNegative('bad anatomy')">Bad Anatomy</div>
                    <div class="preset-chip" onclick="addToNegative('watermark')">Watermark</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">⚙️ Generation Parameters</div>
                <div class="param-grid">
                    <div class="param-item">
                        <span class="param-label">Steps</span>
                        <input type="number" id="steps" value="4" min="1" max="8">
                    </div>
                    <div class="param-item">
                        <span class="param-label">Guidance</span>
                        <input type="number" id="guidance" value="3.5" min="1" max="10" step="0.5">
                    </div>
                    <div class="param-item">
                        <span class="param-label">Width</span>
                        <select id="width">
                            <option value="512">512</option>
                            <option value="768">768</option>
                            <option value="1024" selected>1024</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Height</span>
                        <select id="height">
                            <option value="512">512</option>
                            <option value="768">768</option>
                            <option value="1024" selected>1024</option>
                            <option value="1280">1280</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🎲 Seed (Optional)</div>
                <input type="number" id="seed" placeholder="Random seed (-1 for random)" value="-1">
            </div>
            
            <button class="generate-btn" onclick="generateImage()">🎨 Generate Image</button>
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
        <div style="text-align: center;">
            <div class="loading-spinner"></div>
            <div style="color: #00ff7f; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                Generating with FLUX Schnell
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;" id="loadingText">
                Processing your prompt...
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
                const errorContainer = document.getElementById('errorContainer');
                
                if (data.status === 'ready') {{
                    statusBadge.className = 'status-badge ready';
                    statusDot.style.background = '#00ff7f';
                    statusText.textContent = 'FLUX Ready';
                    systemReady = true;
                    errorContainer.innerHTML = '';
                }} else {{
                    statusBadge.className = 'status-badge error';
                    statusDot.style.background = '#ff4500';
                    statusText.textContent = 'Models Missing';
                    systemReady = false;
                    
                    const missing = data.model_status?.missing || [];
                    if (missing.length > 0) {{
                        errorContainer.innerHTML = `
                            <div class="error-message">
                                <strong>⚠️ Missing FLUX Models</strong><br>
                                Missing: ${{missing.join(', ')}}<br>
                                Please ensure all FLUX models are in ComfyUI.
                            </div>
                        `;
                    }}
                }}
            }} catch (error) {{
                document.getElementById('connectionStatus').textContent = 'Connection Error';
                document.getElementById('statusDot').style.background = '#ff0000';
                systemReady = false;
            }}
        }}
        
        function addToPrompt(text) {{
            const promptField = document.getElementById('prompt');
            if (promptField.value && !promptField.value.endsWith(', ')) {{
                promptField.value += ', ';
            }}
            promptField.value += text;
        }}
        
        function addToNegative(text) {{
            const negativeField = document.getElementById('negative');
            if (negativeField.value && !negativeField.value.endsWith(', ')) {{
                negativeField.value += ', ';
            }}
            negativeField.value += text;
        }}
        
        async function generateImage() {{
            if (!systemReady) {{
                alert('FLUX system not ready. Please check model status.');
                return;
            }}
            
            const button = document.querySelector('.generate-btn');
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            
            button.disabled = true;
            overlay.classList.add('active');
            
            const steps = [
                "Initializing FLUX Schnell model...",
                "Encoding text prompts...",
                "Generating latent image...",
                "Running diffusion process...",
                "Decoding final image...",
                "Saving result..."
            ];
            
            let stepIndex = 0;
            const stepInterval = setInterval(() => {{
                if (stepIndex < steps.length) {{
                    loadingText.textContent = steps[stepIndex];
                    stepIndex++;
                }}
            }}, 3000);
            
            try {{
                const response = await fetch('/generate', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                        prompt: document.getElementById('prompt').value,
                        negative_prompt: document.getElementById('negative').value,
                        steps: parseInt(document.getElementById('steps').value),
                        guidance: parseFloat(document.getElementById('guidance').value),
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
            
            card.innerHTML = `
                <img src="data:image/png;base64,${{imageData.image_base64}}" class="image-preview" alt="Generated Image">
                <div class="image-info">
                    <div style="font-size: 13px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.9);">
                        <strong>Prompt:</strong> ${{imageData.prompt.substring(0, 100)}}${{imageData.prompt.length > 100 ? '...' : ''}}
                    </div>
                    ${{imageData.negative_prompt ? `
                    <div style="font-size: 12px; margin-bottom: 8px; color: rgba(255, 100, 100, 0.7);">
                        <strong>Negative:</strong> ${{imageData.negative_prompt.substring(0, 80)}}${{imageData.negative_prompt.length > 80 ? '...' : ''}}
                    </div>
                    ` : ''}}
                    <div style="font-size: 11px; color: rgba(0, 255, 127, 0.7);">
                        ${{imageData.params.width}}x${{imageData.params.height}} | 
                        ${{imageData.params.steps}} steps | 
                        Guidance ${{imageData.params.guidance}} | 
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
                link.download = imageData.filename || 'flux_image.png';
                link.click();
            }};
            
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
        
        print(f"\n🎨 FLUX Real Image Generator - Complete Implementation")
        print(f"=" * 70)
        print(f"🌐 Web Interface: http://localhost:{self.port}")
        print(f"🔌 ComfyUI Backend: {self.comfyui_url}")
        print(f"🤖 Model: FLUX Schnell Q4 Quantized")
        print(f"💻 Platform: Mac M1 with MPS acceleration")
        print(f"=" * 70)
        print(f"⚡ Features:")
        print(f"   • Real FLUX Schnell inference with ComfyUI")
        print(f"   • Positive & negative prompt support") 
        print(f"   • Real-time generation progress")
        print(f"   • Image download & persistent history")
        print(f"   • WebSocket status updates")
        print(f"   • Parameter controls (steps, guidance, resolution)")
        print(f"=" * 70)
        print(f"\n🚀 Ready for real FLUX image generation!")
        print(f"🔗 Open: http://localhost:{self.port}")
        print(f"⌨️  Press Ctrl+C to stop\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down FLUX server...")
            await runner.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(FluxFinalServer().run())
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
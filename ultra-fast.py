#!/usr/bin/env python3
"""
Ultra-fast ComfyUI inference server for Juggernaut model
Provides a simple localhost API for terminal-based image generation
"""

import json
import asyncio
import aiohttp
from aiohttp import web
import subprocess
import os
import sys
import time
from pathlib import Path
import uuid
import base64
from typing import Optional, Dict, Any

class ComfyUIServer:
    def __init__(self, comfyui_path: str = None, port: int = 8188):
        self.comfyui_path = comfyui_path or os.path.expanduser("~/ComfyUI")
        self.port = port
        self.api_port = 8189  # Our API port
        self.comfyui_process = None
        self.workflow_api = None
        
    async def start_comfyui(self):
        """Start ComfyUI server in the background"""
        print(f"🚀 Starting ComfyUI server on port {self.port}...")
        
        if not os.path.exists(self.comfyui_path):
            print(f"❌ ComfyUI not found at {self.comfyui_path}")
            print(f"Please install ComfyUI first:")
            print(f"  git clone https://github.com/comfyanonymous/ComfyUI.git {self.comfyui_path}")
            sys.exit(1)
            
        # Start ComfyUI server
        self.comfyui_process = subprocess.Popen(
            [sys.executable, "main.py", "--port", str(self.port), "--preview-method", "auto"],
            cwd=self.comfyui_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to be ready
        await self.wait_for_server()
        print(f"✅ ComfyUI server ready at http://localhost:{self.port}")
        
    async def wait_for_server(self, timeout: int = 30):
        """Wait for ComfyUI server to be ready"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"http://localhost:{self.port}/system_stats") as resp:
                        if resp.status == 200:
                            return True
            except:
                await asyncio.sleep(1)
        raise TimeoutError("ComfyUI server failed to start")
        
    def get_juggernaut_workflow(self, prompt: str, negative_prompt: str = "", 
                               steps: int = 20, cfg: float = 7.0,
                               width: int = 1024, height: int = 1024,
                               seed: int = -1) -> dict:
        """Create workflow for Juggernaut XL model"""
        
        if seed == -1:
            seed = random.randint(0, 2**32 - 1)
            
        workflow = {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "dpmpp_2m",
                    "scheduler": "karras",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": "juggernautXL_v9Rundiffusionphoto2.safetensors"
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "juggernaut_output",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        }
        
        return workflow
        
    async def queue_prompt(self, workflow: dict) -> str:
        """Queue a prompt to ComfyUI and return the prompt ID"""
        async with aiohttp.ClientSession() as session:
            data = {"prompt": workflow, "client_id": str(uuid.uuid4())}
            async with session.post(
                f"http://localhost:{self.port}/prompt",
                json=data
            ) as resp:
                result = await resp.json()
                return result.get("prompt_id")
                
    async def get_history(self, prompt_id: str) -> Optional[Dict]:
        """Get generation history for a prompt ID"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://localhost:{self.port}/history/{prompt_id}"
            ) as resp:
                history = await resp.json()
                return history.get(prompt_id)
                
    async def wait_for_generation(self, prompt_id: str, timeout: int = 120) -> Optional[str]:
        """Wait for generation to complete and return the image path"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            history = await self.get_history(prompt_id)
            if history and history.get("outputs"):
                outputs = history["outputs"]
                for node_id, node_output in outputs.items():
                    if "images" in node_output:
                        image_data = node_output["images"][0]
                        filename = image_data["filename"]
                        subfolder = image_data.get("subfolder", "")
                        return os.path.join(self.comfyui_path, "output", subfolder, filename)
            await asyncio.sleep(1)
        return None
        
    async def generate_image(self, request: web.Request) -> web.Response:
        """API endpoint for image generation"""
        try:
            data = await request.json()
            prompt = data.get("prompt", "a beautiful landscape")
            negative_prompt = data.get("negative_prompt", "")
            steps = data.get("steps", 20)
            cfg = data.get("cfg", 7.0)
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            seed = data.get("seed", -1)
            
            # Create workflow
            workflow = self.get_juggernaut_workflow(
                prompt, negative_prompt, steps, cfg, width, height, seed
            )
            
            # Queue generation
            prompt_id = await self.queue_prompt(workflow)
            
            # Wait for completion
            image_path = await self.wait_for_generation(prompt_id)
            
            if image_path and os.path.exists(image_path):
                # Read and encode image
                with open(image_path, "rb") as f:
                    image_data = base64.b64encode(f.read()).decode()
                    
                return web.json_response({
                    "success": True,
                    "prompt_id": prompt_id,
                    "image_path": image_path,
                    "image_base64": image_data,
                    "params": {
                        "prompt": prompt,
                        "negative_prompt": negative_prompt,
                        "steps": steps,
                        "cfg": cfg,
                        "width": width,
                        "height": height,
                        "seed": seed
                    }
                })
            else:
                return web.json_response({
                    "success": False,
                    "error": "Generation failed or timed out"
                }, status=500)
                
        except Exception as e:
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)
            
    async def health_check(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "comfyui_port": self.port,
            "api_port": self.api_port
        })
        
    def create_app(self) -> web.Application:
        """Create the aiohttp application"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_image)
        app.router.add_get('/health', self.health_check)
        app.router.add_get('/', self.index_page)
        return app
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve a simple HTML interface"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ultra-Fast Juggernaut Image Generator</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #555;
                }
                input, textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
                textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: transform 0.2s;
                }
                button:hover {
                    transform: translateY(-2px);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                #result {
                    margin-top: 30px;
                    text-align: center;
                }
                #result img {
                    max-width: 100%;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .loading {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }
                .terminal-example {
                    background: #1e1e1e;
                    color: #4af626;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 30px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎨 Ultra-Fast Juggernaut Image Generator</h1>
                
                <div class="form-group">
                    <label for="prompt">Prompt:</label>
                    <textarea id="prompt" placeholder="Describe what you want to generate...">a majestic mountain landscape at sunset, highly detailed, photorealistic</textarea>
                </div>
                
                <div class="form-group">
                    <label for="negative">Negative Prompt:</label>
                    <textarea id="negative" placeholder="What to avoid in the image...">blurry, low quality, distorted</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="steps">Steps:</label>
                        <input type="number" id="steps" value="20" min="1" max="150">
                    </div>
                    
                    <div class="form-group">
                        <label for="cfg">CFG Scale:</label>
                        <input type="number" id="cfg" value="7" min="1" max="20" step="0.5">
                    </div>
                    
                    <div class="form-group">
                        <label for="width">Width:</label>
                        <input type="number" id="width" value="1024" min="256" max="2048" step="64">
                    </div>
                    
                    <div class="form-group">
                        <label for="height">Height:</label>
                        <input type="number" id="height" value="1024" min="256" max="2048" step="64">
                    </div>
                </div>
                
                <button onclick="generateImage()">Generate Image</button>
                
                <div id="result"></div>
                
                <div class="terminal-example">
                    <strong>Terminal Usage Example:</strong><br><br>
                    # Generate image via curl<br>
                    curl -X POST http://localhost:8189/generate \\<br>
                    &nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
                    &nbsp;&nbsp;-d '{"prompt": "a beautiful sunset", "steps": 20}' \\<br>
                    &nbsp;&nbsp;| jq -r '.image_base64' | base64 -d > output.png<br><br>
                    
                    # Or use Python<br>
                    import requests<br>
                    response = requests.post('http://localhost:8189/generate',<br>
                    &nbsp;&nbsp;json={'prompt': 'a beautiful sunset'})<br>
                    # Image available in response.json()['image_base64']
                </div>
            </div>
            
            <script>
                async function generateImage() {
                    const button = document.querySelector('button');
                    const resultDiv = document.getElementById('result');
                    
                    button.disabled = true;
                    resultDiv.innerHTML = '<div class="loading">🎨 Generating image... This may take 10-30 seconds...</div>';
                    
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
                                height: parseInt(document.getElementById('height').value)
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            resultDiv.innerHTML = `
                                <h3>✨ Generation Complete!</h3>
                                <img src="data:image/png;base64,${data.image_base64}" alt="Generated Image">
                                <p style="color: #666; margin-top: 10px;">Saved to: ${data.image_path}</p>
                            `;
                        } else {
                            resultDiv.innerHTML = `<div style="color: red;">Error: ${data.error}</div>`;
                        }
                    } catch (error) {
                        resultDiv.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
                    } finally {
                        button.disabled = false;
                    }
                }
            </script>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
        
    async def run(self):
        """Run the complete server"""
        # Start ComfyUI
        await self.start_comfyui()
        
        # Create and run API server
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.api_port)
        await site.start()
        
        print(f"\n🌟 Ultra-Fast API Server ready!")
        print(f"📍 Web Interface: http://localhost:{self.api_port}")
        print(f"📍 ComfyUI Interface: http://localhost:{self.port}")
        print(f"\n📝 Terminal Usage:")
        print(f"   curl -X POST http://localhost:{self.api_port}/generate \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"prompt\": \"your prompt here\"}}' ")
        print(f"\nPress Ctrl+C to stop the server...")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down servers...")
            if self.comfyui_process:
                self.comfyui_process.terminate()
            await runner.cleanup()

import random

async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Ultra-fast ComfyUI inference server')
    parser.add_argument('--comfyui-path', type=str, help='Path to ComfyUI installation')
    parser.add_argument('--port', type=int, default=8188, help='ComfyUI port (default: 8188)')
    parser.add_argument('--api-port', type=int, default=8189, help='API server port (default: 8189)')
    
    args = parser.parse_args()
    
    server = ComfyUIServer(
        comfyui_path=args.comfyui_path,
        port=args.port
    )
    server.api_port = args.api_port
    
    await server.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
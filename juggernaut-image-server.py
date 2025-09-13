#!/usr/bin/env python3
"""
Enhanced Juggernaut Image Generation Server
Modern UI with batch processing capabilities
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
import hashlib

class JuggernautImageServer:
    def __init__(self, port: int = 7866):
        self.port = port
        self.generation_history = []
        self.active_generations = {}
        self.output_dir = Path("./output/juggernaut")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    async def generate_image_mock(self, params: dict) -> dict:
        """Mock image generation for testing without ComfyUI"""
        generation_id = str(uuid.uuid4())
        
        # Simulate processing time
        await asyncio.sleep(random.uniform(2, 4))
        
        # Create a placeholder image path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"juggernaut_{timestamp}_{generation_id[:8]}.png"
        filepath = self.output_dir / filename
        
        # Generate mock base64 image (small placeholder)
        mock_image_data = base64.b64encode(b"Mock image data for: " + params['prompt'].encode()).decode()
        
        result = {
            "id": generation_id,
            "prompt": params['prompt'],
            "negative_prompt": params.get('negative_prompt', ''),
            "timestamp": datetime.now().isoformat(),
            "filename": filename,
            "filepath": str(filepath),
            "image_base64": mock_image_data,
            "params": params,
            "status": "completed"
        }
        
        self.generation_history.insert(0, result)
        if len(self.generation_history) > 100:
            self.generation_history = self.generation_history[:100]
            
        return result
        
    async def batch_generate(self, prompts: List[str], base_params: dict) -> List[dict]:
        """Generate multiple images in batch"""
        tasks = []
        for prompt in prompts:
            params = base_params.copy()
            params['prompt'] = prompt
            tasks.append(self.generate_image_mock(params))
        
        results = await asyncio.gather(*tasks)
        return results
        
    async def generate_endpoint(self, request: web.Request) -> web.Response:
        """API endpoint for single image generation"""
        try:
            data = await request.json()
            result = await self.generate_image_mock(data)
            return web.json_response(result)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
            
    async def batch_endpoint(self, request: web.Request) -> web.Response:
        """API endpoint for batch generation"""
        try:
            data = await request.json()
            prompts = data.get('prompts', [])
            base_params = data.get('params', {})
            
            if not prompts:
                return web.json_response({"error": "No prompts provided"}, status=400)
                
            results = await self.batch_generate(prompts, base_params)
            return web.json_response({"results": results})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
            
    async def history_endpoint(self, request: web.Request) -> web.Response:
        """Get generation history"""
        return web.json_response({"history": self.generation_history})
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve the modern UI"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>JUGGERNAUT::IMAGE_GENERATOR</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 400px 1fr;
            gap: 20px;
        }
        
        .control-panel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            height: fit-content;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #00ff88;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .mode-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .mode-tab {
            flex: 1;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #ffffff;
            cursor: pointer;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .mode-tab:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .mode-tab.active {
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            color: #000;
            border-color: transparent;
        }
        
        textarea, input, select {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 12px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        textarea:focus, input:focus, select:focus {
            outline: none;
            border-color: #00ff88;
            background: rgba(0, 0, 0, 0.5);
        }
        
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .param-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .param-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .param-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .generate-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .generate-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .gallery {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
        }
        
        .gallery-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .gallery-title {
            font-size: 18px;
            font-weight: 600;
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .image-card {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .image-card:hover {
            transform: scale(1.02);
            border-color: #00ff88;
        }
        
        .image-preview {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.3);
            font-size: 14px;
        }
        
        .image-info {
            padding: 10px;
        }
        
        .image-prompt {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .image-meta {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 5px;
        }
        
        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
        }
        
        .status-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            background: #00ff88;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
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
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #00ff88;
            font-size: 14px;
        }
        
        .preset-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .preset-chip {
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .preset-chip:hover {
            background: rgba(0, 255, 136, 0.2);
            border-color: #00ff88;
        }
        
        #batchMode {
            display: none;
        }
        
        #batchMode.active {
            display: block;
        }
        
        #singleMode.hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>JUGGERNAUT::IMAGE_GENERATOR</h1>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <div class="mode-tabs">
                <div class="mode-tab active" onclick="switchMode('single')">SINGLE</div>
                <div class="mode-tab" onclick="switchMode('batch')">BATCH</div>
            </div>
            
            <div id="singleMode">
                <div class="section">
                    <div class="section-title">Prompt</div>
                    <textarea id="prompt" placeholder="Describe your image in detail...">cinematic photo of a cyberpunk city at night, neon lights, flying cars, highly detailed, 8k resolution</textarea>
                    <div class="preset-chips">
                        <div class="preset-chip" onclick="addToPrompt('cinematic lighting')">Cinematic</div>
                        <div class="preset-chip" onclick="addToPrompt('highly detailed')">Detailed</div>
                        <div class="preset-chip" onclick="addToPrompt('8k resolution')">8K</div>
                        <div class="preset-chip" onclick="addToPrompt('photorealistic')">Photorealistic</div>
                        <div class="preset-chip" onclick="addToPrompt('masterpiece')">Masterpiece</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Negative Prompt</div>
                    <textarea id="negative" placeholder="What to avoid...">blurry, low quality, distorted, ugly, bad anatomy</textarea>
                </div>
            </div>
            
            <div id="batchMode">
                <div class="section">
                    <div class="section-title">Batch Prompts (one per line)</div>
                    <textarea id="batchPrompts" placeholder="Enter multiple prompts, one per line..." style="min-height: 200px;">a majestic dragon in the mountains
a futuristic space station
an enchanted forest with glowing mushrooms
a steampunk airship in the clouds
a underwater city with bioluminescent creatures</textarea>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Parameters</div>
                <div class="param-grid">
                    <div class="param-item">
                        <span class="param-label">Steps</span>
                        <input type="number" id="steps" value="25" min="1" max="150">
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
                            <option value="1024" selected>1024</option>
                            <option value="1280">1280</option>
                            <option value="1536">1536</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Height</span>
                        <select id="height">
                            <option value="512">512</option>
                            <option value="768">768</option>
                            <option value="1024" selected>1024</option>
                            <option value="1280">1280</option>
                            <option value="1536">1536</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Sampler</div>
                <select id="sampler">
                    <option value="dpmpp_2m">DPM++ 2M</option>
                    <option value="euler_a">Euler A</option>
                    <option value="euler">Euler</option>
                    <option value="ddim">DDIM</option>
                    <option value="uni_pc">UniPC</option>
                </select>
            </div>
            
            <button class="generate-btn" onclick="generateImages()">GENERATE</button>
        </div>
        
        <div class="gallery">
            <div class="gallery-header">
                <div class="gallery-title">Generated Images</div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                    <span id="imageCount">0</span> images
                </div>
            </div>
            <div class="gallery-grid" id="galleryGrid">
                <!-- Images will be added here -->
            </div>
        </div>
    </div>
    
    <div class="status-bar">
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="status-indicator"></div>
            <span class="status-text" id="statusText">Ready</span>
        </div>
        <div class="status-text">
            Port: ${this.port} | Juggernaut XL v9
        </div>
    </div>
    
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text" id="loadingText">Generating image...</div>
        </div>
    </div>
    
    <script>
        let currentMode = 'single';
        let generationHistory = [];
        
        function switchMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            if (mode === 'batch') {
                document.getElementById('singleMode').classList.add('hidden');
                document.getElementById('batchMode').classList.add('active');
            } else {
                document.getElementById('singleMode').classList.remove('hidden');
                document.getElementById('batchMode').classList.remove('active');
            }
        }
        
        function addToPrompt(text) {
            const promptField = document.getElementById('prompt');
            if (promptField.value && !promptField.value.endsWith(', ')) {
                promptField.value += ', ';
            }
            promptField.value += text;
        }
        
        async function generateImages() {
            const button = document.querySelector('.generate-btn');
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            const statusText = document.getElementById('statusText');
            
            button.disabled = true;
            overlay.classList.add('active');
            
            try {
                let response;
                
                if (currentMode === 'single') {
                    loadingText.textContent = 'Generating image...';
                    statusText.textContent = 'Processing...';
                    
                    response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            prompt: document.getElementById('prompt').value,
                            negative_prompt: document.getElementById('negative').value,
                            steps: parseInt(document.getElementById('steps').value),
                            cfg: parseFloat(document.getElementById('cfg').value),
                            width: parseInt(document.getElementById('width').value),
                            height: parseInt(document.getElementById('height').value),
                            sampler: document.getElementById('sampler').value
                        })
                    });
                    
                    const result = await response.json();
                    addImageToGallery(result);
                    
                } else {
                    const prompts = document.getElementById('batchPrompts').value
                        .split('\\n')
                        .filter(p => p.trim());
                    
                    loadingText.textContent = `Generating ${prompts.length} images...`;
                    statusText.textContent = `Processing batch (${prompts.length} images)...`;
                    
                    response = await fetch('/batch', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            prompts: prompts,
                            params: {
                                negative_prompt: document.getElementById('negative').value,
                                steps: parseInt(document.getElementById('steps').value),
                                cfg: parseFloat(document.getElementById('cfg').value),
                                width: parseInt(document.getElementById('width').value),
                                height: parseInt(document.getElementById('height').value),
                                sampler: document.getElementById('sampler').value
                            }
                        })
                    });
                    
                    const data = await response.json();
                    data.results.forEach(result => addImageToGallery(result));
                }
                
                statusText.textContent = 'Generation complete!';
                setTimeout(() => {
                    statusText.textContent = 'Ready';
                }, 3000);
                
            } catch (error) {
                console.error('Error:', error);
                statusText.textContent = 'Error: ' + error.message;
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
            card.innerHTML = `
                <div class="image-preview">
                    Generated Image
                </div>
                <div class="image-info">
                    <div class="image-prompt">${imageData.prompt}</div>
                    <div class="image-meta">
                        ${new Date(imageData.timestamp).toLocaleString()} | 
                        ${imageData.params.width}x${imageData.params.height} | 
                        ${imageData.params.steps} steps
                    </div>
                </div>
            `;
            
            gallery.insertBefore(card, gallery.firstChild);
            document.getElementById('imageCount').textContent = generationHistory.length;
            
            // Keep only last 50 images in gallery
            while (gallery.children.length > 50) {
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
                generateImages();
            }
        });
        
        // Load history when page loads
        loadHistory();
    </script>
</body>
</html>
        """
        return web.Response(text=html, content_type='text/html')
        
    def create_app(self) -> web.Application:
        """Create the web application"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_endpoint)
        app.router.add_post('/batch', self.batch_endpoint)
        app.router.add_get('/history', self.history_endpoint)
        app.router.add_get('/', self.index_page)
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"\n✨ Juggernaut Image Generation Server")
        print(f"🎨 Web Interface: http://localhost:{self.port}")
        print(f"📍 API Endpoints:")
        print(f"   POST http://localhost:{self.port}/generate - Single image")
        print(f"   POST http://localhost:{self.port}/batch - Batch generation")
        print(f"   GET  http://localhost:{self.port}/history - Generation history")
        print(f"\n⚡ Features:")
        print(f"   • Modern UI with dark theme")
        print(f"   • Single and batch generation modes")
        print(f"   • Preset prompt enhancements")
        print(f"   • Real-time generation history")
        print(f"   • Keyboard shortcuts (Ctrl+Enter to generate)")
        print(f"\nPress Ctrl+C to stop the server...")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            await runner.cleanup()

async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Enhanced Juggernaut Image Generation Server')
    parser.add_argument('--port', type=int, default=7866, help='Server port (default: 7866)')
    
    args = parser.parse_args()
    
    server = JuggernautImageServer(port=args.port)
    await server.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
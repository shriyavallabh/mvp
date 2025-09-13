#!/usr/bin/env python3
"""
Ultra-fast Standalone Image Generation Server
Works without ComfyUI installation - perfect for testing
"""

import json
import asyncio
from aiohttp import web
import os
import sys
import uuid
import base64
from typing import Optional, Dict, Any
from datetime import datetime
import random
from PIL import Image, ImageDraw, ImageFont
import io

class StandaloneImageServer:
    def __init__(self, port: int = 8189):
        self.port = port
        self.generation_count = 0
        
    def generate_placeholder_image(self, prompt: str, width: int = 1024, height: int = 1024) -> bytes:
        """Generate a placeholder image with the prompt text"""
        # Create a gradient background
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)
        
        # Create gradient background
        for i in range(height):
            r = int(100 + (155 * i / height))
            g = int(50 + (100 * i / height))
            b = int(150 + (105 * i / height))
            draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))
        
        # Add prompt text
        text_lines = []
        text_lines.append("🎨 Generated Image")
        text_lines.append("")
        text_lines.append("Prompt:")
        
        # Word wrap the prompt
        words = prompt.split()
        current_line = ""
        for word in words:
            if len(current_line + word) < 50:
                current_line += word + " "
            else:
                text_lines.append(current_line.strip())
                current_line = word + " "
        if current_line:
            text_lines.append(current_line.strip())
            
        text_lines.append("")
        text_lines.append(f"Size: {width}x{height}")
        text_lines.append(f"Generated at: {datetime.now().strftime('%H:%M:%S')}")
        
        # Draw text
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        except:
            font = ImageFont.load_default()
            
        y_offset = height // 3
        for line in text_lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            draw.text((x, y_offset), line, fill=(255, 255, 255), font=font)
            y_offset += 35
        
        # Add border
        draw.rectangle([(0, 0), (width-1, height-1)], outline=(255, 255, 255), width=3)
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()
        
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
            seed = data.get("seed", random.randint(0, 2**32 - 1))
            
            self.generation_count += 1
            
            print(f"\n🎨 Generating image #{self.generation_count}")
            print(f"   Prompt: {prompt}")
            print(f"   Size: {width}x{height}, Steps: {steps}, CFG: {cfg}")
            
            # Simulate processing time
            await asyncio.sleep(2)
            
            # Generate placeholder image
            image_bytes = self.generate_placeholder_image(prompt, width, height)
            image_base64 = base64.b64encode(image_bytes).decode()
            
            # Save to output directory
            os.makedirs("output", exist_ok=True)
            filename = f"output/generated_{self.generation_count}.png"
            with open(filename, "wb") as f:
                f.write(image_bytes)
            
            print(f"   ✅ Saved to: {filename}")
            
            return web.json_response({
                "success": True,
                "prompt_id": str(uuid.uuid4()),
                "image_path": filename,
                "image_base64": image_base64,
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
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)
            
    async def health_check(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "mode": "standalone (no ComfyUI required)",
            "api_port": self.port,
            "generation_count": self.generation_count
        })
        
    async def index_page(self, request: web.Request) -> web.Response:
        """Serve a simple HTML interface"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ultra-Fast Image Generator (Standalone)</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 10px;
                    font-size: 2.5em;
                }
                .subtitle {
                    text-align: center;
                    color: #666;
                    margin-bottom: 30px;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    color: #856404;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    text-align: center;
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
                    padding: 12px;
                    border: 2px solid #e1e1e1;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }
                input:focus, textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                textarea {
                    min-height: 100px;
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
                    padding: 15px 30px;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                #result {
                    margin-top: 30px;
                    text-align: center;
                }
                #result img {
                    max-width: 100%;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    margin-top: 20px;
                }
                .loading {
                    text-align: center;
                    color: #666;
                    font-size: 1.2em;
                    padding: 20px;
                }
                .terminal-example {
                    background: #1e1e1e;
                    color: #4af626;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    overflow-x: auto;
                }
                .terminal-example strong {
                    color: #fff;
                    display: block;
                    margin-bottom: 10px;
                }
                .stats {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .stat {
                    text-align: center;
                }
                .stat-value {
                    font-size: 2em;
                    font-weight: bold;
                    color: #667eea;
                }
                .stat-label {
                    color: #666;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Ultra-Fast Image Generator</h1>
                <div class="subtitle">Standalone Mode - No ComfyUI Required</div>
                
                <div class="warning">
                    ⚠️ This is a standalone demo version. For real image generation with Juggernaut XL, please install ComfyUI.
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value" id="genCount">0</div>
                        <div class="stat-label">Images Generated</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">Ready</div>
                        <div class="stat-label">Server Status</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">8189</div>
                        <div class="stat-label">API Port</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="prompt">✨ Prompt:</label>
                    <textarea id="prompt" placeholder="Describe what you want to generate...">a majestic mountain landscape at sunset, highly detailed, photorealistic, 8k resolution</textarea>
                </div>
                
                <div class="form-group">
                    <label for="negative">🚫 Negative Prompt:</label>
                    <textarea id="negative" placeholder="What to avoid in the image...">blurry, low quality, distorted, ugly</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="resolution">📐 Resolution:</label>
                        <select id="resolution" onchange="updateResolution()">
                            <option value="512x512">512x512 (Square)</option>
                            <option value="768x768">768x768 (Square HD)</option>
                            <option value="1024x1024" selected>1024x1024 (Square XL)</option>
                            <option value="1920x1080">1920x1080 (Full HD)</option>
                            <option value="1280x720">1280x720 (HD)</option>
                            <option value="768x1344">768x1344 (Portrait)</option>
                            <option value="1344x768">1344x768 (Landscape)</option>
                            <option value="custom">Custom Size</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="steps">🔢 Steps:</label>
                        <input type="number" id="steps" value="20" min="1" max="150">
                    </div>
                    
                    <div class="form-group">
                        <label for="cfg">⚙️ CFG Scale:</label>
                        <input type="number" id="cfg" value="7" min="1" max="20" step="0.5">
                    </div>
                </div>
                
                <div class="form-row" id="customSize" style="display: none;">
                    <div class="form-group">
                        <label for="width">📏 Width:</label>
                        <input type="number" id="width" value="1024" min="256" max="2048" step="64">
                    </div>
                    
                    <div class="form-group">
                        <label for="height">📐 Height:</label>
                        <input type="number" id="height" value="1024" min="256" max="2048" step="64">
                    </div>
                </div>
                
                <button onclick="generateImage()">🎨 Generate Image</button>
                
                <div id="result"></div>
                
                <div class="terminal-example">
                    <strong>💻 Terminal Usage Examples:</strong>
                    
                    # Quick generation with curl
                    curl -X POST http://localhost:8189/generate \
                      -H "Content-Type: application/json" \
                      -d '{"prompt": "a beautiful sunset over ocean"}'
                    
                    # Save image directly from terminal
                    curl -sX POST http://localhost:8189/generate \
                      -H "Content-Type: application/json" \
                      -d '{"prompt": "cyberpunk city at night", "width": 1920, "height": 1080}' \
                      | jq -r '.image_base64' | base64 -d > output.png
                    
                    # Python example
                    import requests
                    import base64
                    
                    response = requests.post('http://localhost:8189/generate', 
                        json={'prompt': 'futuristic spaceship'})
                    
                    if response.json()['success']:
                        image_data = base64.b64decode(response.json()['image_base64'])
                        with open('spaceship.png', 'wb') as f:
                            f.write(image_data)
                </div>
            </div>
            
            <script>
                let generationCount = 0;
                
                function updateResolution() {
                    const select = document.getElementById('resolution');
                    const customDiv = document.getElementById('customSize');
                    const widthInput = document.getElementById('width');
                    const heightInput = document.getElementById('height');
                    
                    if (select.value === 'custom') {
                        customDiv.style.display = 'grid';
                    } else {
                        customDiv.style.display = 'none';
                        if (select.value !== 'custom') {
                            const [width, height] = select.value.split('x');
                            widthInput.value = width;
                            heightInput.value = height;
                        }
                    }
                }
                
                async function updateStats() {
                    try {
                        const response = await fetch('/health');
                        const data = await response.json();
                        document.getElementById('genCount').textContent = data.generation_count || 0;
                    } catch (e) {
                        console.error('Failed to update stats:', e);
                    }
                }
                
                async function generateImage() {
                    const button = document.querySelector('button');
                    const resultDiv = document.getElementById('result');
                    
                    button.disabled = true;
                    button.textContent = '⏳ Generating...';
                    resultDiv.innerHTML = '<div class="loading">🎨 Creating your image... (Standalone mode - 2 second simulation)</div>';
                    
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
                            generationCount++;
                            resultDiv.innerHTML = `
                                <h3>✨ Generation Complete!</h3>
                                <img src="data:image/png;base64,${data.image_base64}" alt="Generated Image">
                                <p style="color: #666; margin-top: 10px;">
                                    📁 Saved to: ${data.image_path}<br>
                                    🆔 ID: ${data.prompt_id}
                                </p>
                            `;
                            updateStats();
                        } else {
                            resultDiv.innerHTML = `
                                <div style="background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00;">
                                    <h3>❌ Generation Failed</h3>
                                    <p>${data.error || 'Unknown error occurred'}</p>
                                    <p style="font-size: 0.9em; margin-top: 10px;">Please try again with different parameters.</p>
                                </div>
                            `;
                        }
                    } catch (error) {
                        resultDiv.innerHTML = `
                            <div style="background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c00;">
                                <h3>❌ Connection Error</h3>
                                <p>${error.message}</p>
                                <p style="font-size: 0.9em; margin-top: 10px;">Make sure the server is running and accessible.</p>
                            </div>
                        `;
                    } finally {
                        button.disabled = false;
                        button.textContent = '🎨 Generate Image';
                    }
                }
                
                // Update stats on page load
                updateStats();
                setInterval(updateStats, 5000);
            </script>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
        
    def create_app(self) -> web.Application:
        """Create the aiohttp application"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_image)
        app.router.add_get('/health', self.health_check)
        app.router.add_get('/', self.index_page)
        return app
        
    async def run(self):
        """Run the server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print("\n" + "="*60)
        print("🚀 ULTRA-FAST IMAGE GENERATION SERVER")
        print("="*60)
        print(f"\n✅ Server is running in STANDALONE mode")
        print(f"   (No ComfyUI required - using placeholder images)")
        print(f"\n📍 Web Interface: http://localhost:{self.port}")
        print(f"📍 API Endpoint: http://localhost:{self.port}/generate")
        print(f"📍 Health Check: http://localhost:{self.port}/health")
        print(f"\n📝 Quick Terminal Test:")
        print(f"   curl -X POST http://localhost:{self.port}/generate \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"prompt\": \"test image\"}}'")
        print(f"\n⌨️  Press Ctrl+C to stop the server...")
        print("="*60 + "\n")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            await runner.cleanup()

async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Ultra-fast standalone image generation server')
    parser.add_argument('--port', type=int, default=8189, help='Server port (default: 8189)')
    
    args = parser.parse_args()
    
    server = StandaloneImageServer(port=args.port)
    await server.run()

if __name__ == "__main__":
    # Check for required packages
    try:
        import aiohttp
        from PIL import Image
    except ImportError:
        print("❌ Missing required packages. Please install:")
        print("   pip install aiohttp pillow")
        sys.exit(1)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
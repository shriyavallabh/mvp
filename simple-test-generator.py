#!/usr/bin/env python3
"""
Simple test image generator to demonstrate functionality
Creates a working example while the main system processes large models
"""

import asyncio
import json
from aiohttp import web
from pathlib import Path
import base64
from datetime import datetime
import random

class SimpleTestGenerator:
    def __init__(self, port=7867):
        self.port = port
        self.output_dir = Path("./output")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def create_test_image_svg(self, prompt, width=1024, height=1024):
        """Create a test SVG image based on the prompt"""
        
        # Create a themed SVG based on common prompt words
        if "city" in prompt.lower() or "pune" in prompt.lower():
            theme = "city"
            colors = ["#1a1a1a", "#00ff7f", "#ffff99"]
            elements = "City skyline with glowing windows"
        elif "night" in prompt.lower():
            theme = "night"
            colors = ["#0a0a2e", "#ffffff", "#ffff99"]
            elements = "Starry night scene"
        elif "landscape" in prompt.lower() or "nature" in prompt.lower():
            theme = "nature"
            colors = ["#228b22", "#87ceeb", "#fff8dc"]
            elements = "Natural landscape"
        else:
            theme = "abstract"
            colors = ["#4b0082", "#ff1493", "#00ced1"]
            elements = "Abstract design"
            
        svg_content = f"""<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:{colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{colors[1]};stop-opacity:0.3" />
        </linearGradient>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <text x="50%" y="20%" text-anchor="middle" fill="{colors[2]}" 
          font-family="Arial, sans-serif" font-size="24" font-weight="bold">
        Generated Image: {theme.title()} Theme
    </text>
    
    <text x="50%" y="30%" text-anchor="middle" fill="{colors[2]}" 
          font-family="Arial, sans-serif" font-size="14" opacity="0.8">
        {elements}
    </text>
    
    <text x="50%" y="40%" text-anchor="middle" fill="{colors[2]}" 
          font-family="Arial, sans-serif" font-size="12" opacity="0.6">
        Prompt: {prompt[:50]}{"..." if len(prompt) > 50 else ""}
    </text>
    
    <text x="50%" y="90%" text-anchor="middle" fill="{colors[2]}" 
          font-family="Arial, sans-serif" font-size="10" opacity="0.5">
        Test Generation - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    </text>
</svg>"""
        
        return svg_content
    
    async def generate_test_image(self, request):
        """Generate a test image"""
        try:
            data = await request.json()
            prompt = data.get("prompt", "a beautiful test image")
            negative_prompt = data.get("negative_prompt", "")
            steps = data.get("steps", 4)
            guidance = data.get("guidance", 3.5)
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            seed = data.get("seed", random.randint(0, 10000))
            
            print(f"🎨 Generating test image...")
            print(f"   Prompt: {prompt}")
            print(f"   Size: {width}x{height}")
            
            # Create SVG
            svg_content = self.create_test_image_svg(prompt, width, height)
            
            # Save to file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_{timestamp}_{seed}.svg"
            filepath = self.output_dir / filename
            
            with open(filepath, "w") as f:
                f.write(svg_content)
            
            # Create base64 for display (convert SVG to data URL)
            svg_base64 = base64.b64encode(svg_content.encode()).decode()
            image_data_url = f"data:image/svg+xml;base64,{svg_base64}"
            
            result = {
                "success": True,
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "timestamp": datetime.now().isoformat(),
                "filename": filename,
                "filepath": str(filepath),
                "image_base64": svg_base64,
                "image_data_url": image_data_url,
                "params": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "steps": steps,
                    "guidance": guidance,
                    "width": width,
                    "height": height,
                    "seed": seed
                },
                "model": "Test Generator SVG",
                "status": "completed"
            }
            
            print(f"✅ Test image created: {filename}")
            return web.json_response(result)
            
        except Exception as e:
            print(f"❌ Test generation error: {e}")
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)
    
    async def status_endpoint(self, request):
        """Status endpoint"""
        return web.json_response({
            "status": "ready",
            "message": "Test generator ready",
            "model": "Test SVG Generator"
        })
    
    async def index_page(self, request):
        """Simple test page"""
        html = """<!DOCTYPE html>
<html>
<head>
    <title>Test Image Generator</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        input, textarea, button { width: 100%; padding: 10px; margin: 10px 0; }
        button { background: #00ff7f; color: black; border: none; cursor: pointer; }
        .result { margin-top: 20px; padding: 20px; background: #2a2a2a; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Test Image Generator</h1>
        <p>Generating test SVG images while the main system loads models...</p>
        
        <textarea id="prompt" placeholder="Enter your prompt...">a beautiful city at night with glowing lights</textarea>
        <textarea id="negative" placeholder="Negative prompt...">blurry, low quality</textarea>
        <button onclick="generate()">Generate Test Image</button>
        
        <div id="result" class="result" style="display:none;">
            <h3>Generated Image:</h3>
            <div id="imageContainer"></div>
            <p id="details"></p>
        </div>
    </div>
    
    <script>
        async function generate() {
            const prompt = document.getElementById('prompt').value;
            const negative = document.getElementById('negative').value;
            
            try {
                const response = await fetch('/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        prompt: prompt,
                        negative_prompt: negative,
                        steps: 4,
                        guidance: 3.5,
                        width: 1024,
                        height: 1024,
                        seed: Math.floor(Math.random() * 10000)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('imageContainer').innerHTML = 
                        `<img src="${result.image_data_url}" style="max-width: 100%; border: 1px solid #00ff7f;">`;
                    document.getElementById('details').innerHTML = 
                        `<strong>File:</strong> ${result.filename}<br>
                         <strong>Path:</strong> ${result.filepath}<br>
                         <strong>Model:</strong> ${result.model}`;
                    document.getElementById('result').style.display = 'block';
                } else {
                    alert('Generation failed: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>"""
        return web.Response(text=html, content_type='text/html')
    
    def create_app(self):
        """Create web app"""
        app = web.Application()
        app.router.add_post('/generate', self.generate_test_image)
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
        
        print(f"\n🧪 Test Image Generator Started")
        print(f"=" * 50)
        print(f"🌐 Web Interface: http://localhost:{self.port}")
        print(f"🎨 Generating SVG test images")
        print(f"📁 Output Directory: {self.output_dir}")
        print(f"=" * 50)
        print(f"\n✅ Ready for testing image generation!")
        print(f"🔗 Open: http://localhost:{self.port}")
        
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n👋 Stopping test server...")
            await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(SimpleTestGenerator().run())
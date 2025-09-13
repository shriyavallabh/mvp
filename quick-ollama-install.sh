#!/bin/bash

# Quick Ollama Installation for VM
echo "🚀 Quick Ollama Setup"
echo "===================="

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start service
systemctl enable ollama
systemctl start ollama

# Pull model
ollama pull llama2

# Test
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama2", "prompt": "Hello", "stream": false}' \
  | python3 -c "import sys, json; print('Ollama says:', json.load(sys.stdin).get('response', 'No response')[:100])"

# Restart webhook
cd /root/webhook
pm2 restart webhook

echo "✅ Done! Check: pm2 logs webhook"
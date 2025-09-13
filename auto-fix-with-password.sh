#!/bin/bash

# This script will try to auto-install Ollama using the new password
# Run this after receiving the password email

echo "Enter the new password from your email:"
read -s PASSWORD

echo ""
echo "Connecting to VM and installing Ollama..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@159.89.166.94 << 'ENDSSH'
echo "Connected! Installing Ollama..."

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
systemctl enable ollama
systemctl start ollama

# Pull llama2 model
echo "Downloading llama2 model (this takes 2-3 minutes)..."
ollama pull llama2

# Restart webhook
cd /root/webhook
pm2 restart webhook

# Test
echo "Testing Ollama..."
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama2", "prompt": "Hello", "stream": false}' \
  | python3 -c "import sys, json; print('Ollama says:', json.load(sys.stdin).get('response', '')[:50])"

echo "✅ Ollama installation complete!"
pm2 status
ENDSSH

echo "✅ Done! Ollama is now installed on your VM."

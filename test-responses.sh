#!/bin/bash

echo "Testing contextual responses..."

# Test 1: Investment amount
curl -s -X POST https://6ecac5910ac8.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"919765071249","type":"text","text":{"body":"I have 50000 to invest"}}]}}]}]}'

sleep 2

# Test 2: Stocks vs MF
curl -s -X POST https://6ecac5910ac8.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"919765071249","type":"text","text":{"body":"Should I invest in stocks or mutual funds?"}}]}}]}]}'

sleep 2

# Test 3: SIP
curl -s -X POST https://6ecac5910ac8.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"919765071249","type":"text","text":{"body":"Tell me about SIP"}}]}}]}]}'

echo "Done! Check your WhatsApp for 3 different contextual responses"

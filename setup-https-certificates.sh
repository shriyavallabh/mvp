#!/bin/bash

echo "🔒 SETTING UP HTTPS CERTIFICATES ON YOUR VM"
echo "==========================================="
echo ""

# Create certificate directory
sudo mkdir -p /etc/ssl/webhook
cd /etc/ssl/webhook

# Generate self-signed certificate (valid for 365 days)
echo "Generating SSL certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout private.key \
    -out certificate.crt \
    -subj "/C=US/ST=State/L=City/O=FinAdvise/CN=webhook"

# Set proper permissions
sudo chmod 600 private.key
sudo chmod 644 certificate.crt

echo "✅ SSL certificates created!"
echo ""
echo "Certificate location:"
echo "  Private key: /etc/ssl/webhook/private.key"
echo "  Certificate: /etc/ssl/webhook/certificate.crt"
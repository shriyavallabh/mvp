#!/bin/bash

echo "Setting up SSH key and connecting to your VM..."
echo ""

# Create SSH key file
mkdir -p ~/.ssh

# Save the private key (you need to have this)
cat > ~/.ssh/mvp-digitalocean << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
[YOUR PRIVATE KEY HERE]
-----END OPENSSH PRIVATE KEY-----
EOF

# Set correct permissions
chmod 600 ~/.ssh/mvp-digitalocean

# Now SSH into the VM
ssh -i ~/.ssh/mvp-digitalocean root@134.209.154.123
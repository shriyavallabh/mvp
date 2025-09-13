#!/bin/bash

# Quick Dashboard Deploy Script
VM_IP="159.89.166.94"

echo "🚀 Quick deployment to $VM_IP"
echo ""
echo "This script will help you deploy the dashboard."
echo "You'll need to enter your VM password when prompted."
echo ""

# Create a simplified deployment package
cat > /tmp/dashboard-install.sh << 'INSTALLER'
#!/bin/bash
cd /home/mvp
mkdir -p monitoring
cd monitoring

# Download dashboard files from GitHub (if you have a repo) or create inline
cat > dashboard-server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>FinAdvise Dashboard</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>FinAdvise Dashboard - Quick Setup</h1>
        <p>The full dashboard is being deployed...</p>
        <p>Check back in a few minutes at <a href="http://159.89.166.94:8080">http://159.89.166.94:8080</a></p>
        <hr>
        <p>Status: Installing...</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Dashboard placeholder running on port ${PORT}`);
});
EOF

# Install basic dependencies
npm init -y
npm install express
node dashboard-server.js &

echo "Quick dashboard started on port 8080"
INSTALLER

echo "Copying installer to VM..."
scp -o StrictHostKeyChecking=no /tmp/dashboard-install.sh root@$VM_IP:/tmp/

echo ""
echo "Now SSH into your VM and run:"
echo "  ssh root@$VM_IP"
echo "  bash /tmp/dashboard-install.sh"
echo ""
echo "Or I'll try to run it for you (enter password when prompted):"
ssh -o StrictHostKeyChecking=no root@$VM_IP "bash /tmp/dashboard-install.sh"
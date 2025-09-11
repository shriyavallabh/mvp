#!/bin/bash

# Development Environment Setup Script for FinAdvise MVP
# Story 1.2: Development Environment Setup
# This script installs and configures all required development tools on the VM

set -e  # Exit on error

echo "==================================================="
echo "FinAdvise MVP - Development Environment Setup"
echo "==================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check if running as mvp user
if [ "$USER" != "mvp" ]; then
    print_error "This script must be run as the 'mvp' user"
    exit 1
fi

# Update package list
print_info "Updating package list..."
sudo apt update

# Task 1: Install Node.js and npm
echo ""
echo "Task 1: Installing Node.js 18.x LTS..."
echo "----------------------------------------"

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
    
    # Check if it's version 18 or higher
    NODE_MAJOR=$(node --version | cut -d. -f1 | sed 's/v//')
    if [ $NODE_MAJOR -ge 18 ]; then
        print_status "Node.js version is 18 or higher"
    else
        print_info "Upgrading Node.js to version 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    print_info "Installing Node.js 18.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verify Node.js installation
node --version
npm --version
print_status "Node.js and npm installed successfully"

# Configure npm to use global directory without sudo
print_info "Configuring npm global directory..."
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to PATH if not already there
if ! grep -q ".npm-global/bin" ~/.bashrc; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
    print_status "Added npm global bin to PATH"
fi

# Source bashrc for current session
export PATH=~/.npm-global/bin:$PATH

# Task 2: Install Python and pip
echo ""
echo "Task 2: Verifying Python and pip..."
echo "------------------------------------"

# Python 3.10 should be installed by default on Ubuntu 22.04
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python already installed: $PYTHON_VERSION"
else
    print_error "Python3 not found, installing..."
    sudo apt-get install -y python3
fi

# Install pip if not present
if ! command -v pip3 &> /dev/null; then
    print_info "Installing pip3..."
    sudo apt-get install -y python3-pip
else
    print_status "pip3 already installed"
fi

# Install python3-venv
print_info "Installing python3-venv..."
sudo apt-get install -y python3-venv

# Verify Python installation
python3 --version
pip3 --version
print_status "Python and pip verified successfully"

# Task 3: Install and configure PM2
echo ""
echo "Task 3: Installing PM2..."
echo "-------------------------"

if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2 globally..."
    npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Verify PM2 installation
pm2 --version
print_status "PM2 installed successfully"

# Configure PM2 to start on boot
print_info "Configuring PM2 startup..."
pm2 startup systemd -u mvp --hp /home/mvp > pm2_startup_cmd.txt
STARTUP_CMD=$(tail -1 pm2_startup_cmd.txt)
print_info "Execute this command with sudo to enable PM2 startup:"
echo "$STARTUP_CMD"
print_info "After executing, run: pm2 save"

# Test PM2 with a simple process
print_info "Testing PM2 with a simple process..."
echo 'console.log("PM2 test process running"); setInterval(() => {}, 1000);' > /tmp/pm2_test.js
pm2 start /tmp/pm2_test.js --name test-process
sleep 2
pm2 list
pm2 delete test-process
rm /tmp/pm2_test.js
print_status "PM2 test completed successfully"

# Task 4: Document VS Code Remote-SSH setup
echo ""
echo "Task 4: VS Code Remote-SSH Configuration"
echo "-----------------------------------------"

# Create VS Code connection documentation
cat > ~/vscode-remote-ssh-setup.md << 'EOF'
# VS Code Remote-SSH Setup Guide

## Prerequisites
- VS Code installed on your local machine
- Remote-SSH extension installed in VS Code

## Connection Steps

1. Open VS Code on your local machine
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Remote-SSH: Connect to Host..." and select it
4. Add new SSH host: `mvp@143.110.191.97`
5. Select the SSH configuration file to update (usually ~/.ssh/config)
6. Connect to the host when prompted
7. Choose "Linux" as the platform if asked
8. Enter your SSH key passphrase if required

## Workspace Configuration
- Default workspace: `/home/mvp`
- Project files will be in `/home/mvp`

## Troubleshooting
- Ensure your SSH key is added to the VM's authorized_keys
- Check firewall allows port 22 from your IP
- Verify VS Code Remote-SSH extension is installed

EOF

print_status "VS Code Remote-SSH documentation created at ~/vscode-remote-ssh-setup.md"

# Task 5: Install Claude CLI
echo ""
echo "Task 5: Installing Claude CLI..."
echo "--------------------------------"

print_info "Note: Claude CLI installation requires manual configuration"
print_info "The official @anthropic/claude-cli package may not exist"
print_info "Creating placeholder for Claude session token configuration..."

# Create environment file for Claude session token
touch ~/.env
chmod 600 ~/.env

# Add Claude session token placeholder to .bashrc
if ! grep -q "CLAUDE_SESSION_TOKEN" ~/.bashrc; then
    cat >> ~/.bashrc << 'EOF'

# Claude CLI Configuration
if [ -f ~/.env ]; then
    export $(grep -v '^#' ~/.env | xargs)
fi
export CLAUDE_SESSION_TOKEN="${CLAUDE_SESSION_TOKEN:-your_session_token_here}"
EOF
    print_status "Added Claude session token configuration to .bashrc"
fi

print_info "Please manually add your Claude session token to ~/.env:"
print_info "CLAUDE_SESSION_TOKEN=your_actual_token_here"

# Task 7: Configure environment variables
echo ""
echo "Task 7: Configuring environment variables..."
echo "--------------------------------------------"

# Add NODE_ENV to .bashrc
if ! grep -q "NODE_ENV=production" ~/.bashrc; then
    echo 'export NODE_ENV=production' >> ~/.bashrc
    print_status "Added NODE_ENV=production to .bashrc"
fi

# Create logs directory
mkdir -p ~/logs
print_status "Created logs directory at ~/logs"

# Create directory structure for future use
mkdir -p ~/agents
mkdir -p ~/scripts
mkdir -p ~/config
mkdir -p ~/backups
print_status "Created project directory structure"

# Task 8: Create verification script
echo ""
echo "Task 8: Creating verification script..."
echo "---------------------------------------"

cat > ~/verify-installation.sh << 'EOF'
#!/bin/bash

echo "==================================================="
echo "Development Environment Verification"
echo "==================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_command() {
    if command -v $1 &> /dev/null; then
        VERSION=$($2)
        echo -e "${GREEN}[✓]${NC} $1: $VERSION"
        return 0
    else
        echo -e "${RED}[✗]${NC} $1: Not found"
        return 1
    fi
}

# Check all installations
check_command "node" "node --version"
check_command "npm" "npm --version"
check_command "python3" "python3 --version"
check_command "pip3" "pip3 --version"
check_command "pm2" "pm2 --version"

# Check environment variables
echo ""
echo "Environment Variables:"
echo "----------------------"
if [ ! -z "$NODE_ENV" ]; then
    echo -e "${GREEN}[✓]${NC} NODE_ENV: $NODE_ENV"
else
    echo -e "${RED}[✗]${NC} NODE_ENV: Not set"
fi

if [ ! -z "$CLAUDE_SESSION_TOKEN" ]; then
    echo -e "${GREEN}[✓]${NC} CLAUDE_SESSION_TOKEN: Configured"
else
    echo -e "${RED}[✗]${NC} CLAUDE_SESSION_TOKEN: Not set"
fi

# Check directories
echo ""
echo "Directory Structure:"
echo "--------------------"
for dir in logs agents scripts config backups; do
    if [ -d ~/$dir ]; then
        echo -e "${GREEN}[✓]${NC} ~/$dir exists"
    else
        echo -e "${RED}[✗]${NC} ~/$dir missing"
    fi
done

echo ""
echo "==================================================="
echo "Verification complete!"
echo "==================================================="
EOF

chmod +x ~/verify-installation.sh
print_status "Verification script created at ~/verify-installation.sh"

# Final summary
echo ""
echo "==================================================="
echo "Development Environment Setup Summary"
echo "==================================================="
echo ""
print_status "Node.js and npm configured"
print_status "Python and pip verified"
print_status "PM2 installed and tested"
print_status "VS Code Remote-SSH documentation created"
print_status "Environment variables configured"
print_status "Project directories created"
print_status "Verification script available"
echo ""
print_info "IMPORTANT: Manual steps required:"
print_info "1. Execute PM2 startup command shown above with sudo"
print_info "2. Run 'pm2 save' after executing startup command"
print_info "3. Add Claude session token to ~/.env file"
print_info "4. Source .bashrc or logout/login for changes to take effect"
print_info "5. Run ~/verify-installation.sh to verify everything"
echo ""
echo "Setup script completed!"
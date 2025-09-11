# FinAdvise MVP - VM Development Environment Setup

## VM Details
- **IP Address**: 143.110.191.97
- **OS**: Ubuntu 22.04 LTS
- **User**: mvp
- **Location**: DigitalOcean BLR1 (Bangalore)

## Story 1.2: Development Environment Setup

### Installed Software
- **Node.js**: v18.20.8 LTS ✅
- **npm**: 10.8.2 ✅
- **Python**: 3.10.12 (Ubuntu default) ✅
- **pip3**: Python package manager ✅
- **PM2**: 6.0.10 (with systemd startup) ✅
- **Claude Code**: 1.0.108 (authenticated with Max plan) ✅
- **Anthropic SDK**: Python package installed ✅

### Directory Structure
```
/home/mvp/
├── agents/       # Claude agent definitions
├── scripts/      # Python/JS scripts
├── logs/        # Application logs
├── config/      # Configuration files
└── backups/     # Local backups
```

### Environment Variables
Located in `/home/mvp/.bashrc`:
- `NODE_ENV=production`
- `PATH` includes `~/.npm-global/bin`
- `CLAUDE_SESSION_TOKEN` (needs to be set in ~/.env)

### Setup Instructions

1. **From Local Machine**:
   ```bash
   # Make deployment script executable
   chmod +x deploy-dev-setup.sh
   
   # Run deployment
   ./deploy-dev-setup.sh
   ```

2. **Manual Steps on VM**:
   ```bash
   # SSH into VM
   ssh mvp@143.110.191.97
   
   # Complete PM2 startup configuration
   # Run the command shown by setup script
   sudo env PATH=$PATH:/usr/bin /home/mvp/.npm-global/lib/node_modules/pm2/bin/pm2 startup systemd -u mvp --hp /home/mvp
   
   # Save PM2 configuration
   pm2 save
   
   # Add Claude session token
   echo "CLAUDE_SESSION_TOKEN=your_actual_token" > ~/.env
   chmod 600 ~/.env
   
   # Reload environment
   source ~/.bashrc
   
   # Verify installation
   ~/verify-installation.sh
   ```

### VS Code Remote-SSH Setup

1. Install VS Code and Remote-SSH extension on local machine
2. Add SSH host in VS Code:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Select "Remote-SSH: Connect to Host..."
   - Enter: `mvp@143.110.191.97`
3. Connect and open folder `/home/mvp`

### PM2 Process Management

PM2 will manage:
- `webhook-server` (Python webhook server)
- `claude-session` (Node.js session maintenance)

Configuration will be in `/home/mvp/ecosystem.config.js` (created in future stories)

### Security Notes
- Never commit `.env` file to version control
- Keep `CLAUDE_SESSION_TOKEN` secure
- PM2 runs as `mvp` user, not root
- All sensitive variables in environment files

### Verification
Run `~/verify-installation.sh` to check all components are properly installed.

### Claude Code Usage

**Claude Code is authenticated with Max plan** (no API key needed):
```bash
# Use Claude Code
~/.npm-global/bin/claude "Your prompt here"

# Or with PATH export
export PATH=$PATH:~/.npm-global/bin
claude "Your prompt here"
```

### Troubleshooting

**Node.js/npm issues**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**PM2 not starting on boot**:
```bash
pm2 startup systemd -u mvp --hp /home/mvp
# Execute the command it outputs with sudo
pm2 save
```

**Permission issues with npm global packages**:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Claude Code authentication**:
- Already authenticated with Max plan via browser
- Session persists across SSH sessions
- No API charges - using Max plan subscription
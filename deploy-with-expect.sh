#!/usr/bin/expect -f

set timeout 180
set password "5eafaafbc8a4e958fa6366aeea"
set new_password "Story32Webhook2024!"

spawn ssh root@139.59.51.237

expect {
    "password:" {
        send "$password\r"
        expect {
            "Current password:" {
                send "$password\r"
                expect "New password:"
                send "$new_password\r"
                expect "Retype new password:"
                send "$new_password\r"
                expect "root@"
            }
            "root@" {
                # Already logged in
            }
        }
    }
}

# Now deploy
send "cd /root\r"
expect "root@"

send "apt-get update -y && apt-get install -y nodejs npm nginx\r"
expect "root@"

send "npm install -g pm2\r"
expect "root@"

send "mkdir -p /root/webhook && cd /root/webhook\r"
expect "root@"

# Create package.json
send "cat > package.json << 'EOF'
{
  \"name\": \"story-3.2-webhook\",
  \"version\": \"1.0.0\",
  \"dependencies\": {
    \"express\": \"^4.18.2\",
    \"axios\": \"^1.6.0\",
    \"dotenv\": \"^16.0.3\"
  }
}
EOF\r"
expect "root@"

send "npm install\r"
expect "root@"

# Create .env
send "cat > .env << 'EOF'
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD
EOF\r"
expect "root@"

# Create webhook.js
send "cat > webhook.js << 'EOF'
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('Story 3.2 Webhook Starting...');

app.get('/webhook', (req, res) => {
    const mode = req.query\['hub.mode'\];
    const token = req.query\['hub.verify_token'\];
    const challenge = req.query\['hub.challenge'\];
    
    console.log(\`Verification: mode=\${mode}, token=\${token}, challenge=\${challenge}\`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('WEBHOOK VERIFIED!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/webhook', async (req, res) => {
    console.log('Webhook event received');
    res.status(200).send('OK');
    
    try {
        const entry = req.body.entry?\[0\];
        const messages = entry?.changes?\[0\]?.value?.messages || \[\];
        
        for (const message of messages) {
            const from = message.from;
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                console.log(\`Button clicked: \${buttonId} from \${from}\`);
                
                let responseText = '';
                switch(buttonId) {
                    case 'UNLOCK_IMAGES':
                        responseText = 'Your daily images are ready!';
                        break;
                    case 'UNLOCK_CONTENT':
                        responseText = 'Here is your personalized content!';
                        break;
                    case 'UNLOCK_UPDATES':
                        responseText = 'Live Market Update: Nifty up 1.2%';
                        break;
                }
                
                await sendMessage(from, responseText);
                
            } else if (message.type === 'text') {
                const text = message.text.body;
                console.log(\`Text from \${from}: \${text}\`);
                await sendMessage(from, 'Thank you for your message!');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function sendMessage(to, text) {
    try {
        await axios.post(
            \`https://graph.facebook.com/v23.0/\${CONFIG.phoneNumberId}/messages\`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': \`Bearer \${CONFIG.accessToken}\`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(\`Response sent to \${to}\`);
    } catch (error) {
        console.error('Send failed:', error.message);
    }
}

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Story 3.2' });
});

app.get('/', (req, res) => {
    res.send('Story 3.2 Webhook Running on VM!');
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(\`Webhook running on port \${CONFIG.port}\`);
});
EOF\r"
expect "root@"

# Configure nginx
send "cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF\r"
expect "root@"

send "nginx -t && systemctl restart nginx\r"
expect "root@"

send "pm2 kill\r"
expect "root@"

send "pm2 start webhook.js --name story-3.2\r"
expect "root@"

send "pm2 save\r"
expect "root@"

# Test webhook
send "curl 'http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=VM_DEPLOYED'\r"
expect "VM_DEPLOYED"

send "exit\r"
expect eof

puts "\n✅ DEPLOYMENT COMPLETE!"
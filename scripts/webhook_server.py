#!/usr/bin/env python3
"""
FinAdvise MVP Webhook Server
Receives triggers from Google Apps Script and manages process execution
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from functools import wraps
import subprocess

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/shriyavallabh/Desktop/mvp/logs/webhook.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('webhook_server')

# Configuration
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'default_secret_change_me')
PORT = int(os.environ.get('WEBHOOK_PORT', 5001))

def validate_request(f):
    """Decorator to validate incoming webhook requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for secret token in headers
        auth_header = request.headers.get('X-Webhook-Secret')
        if auth_header != WEBHOOK_SECRET:
            logger.warning(f"Unauthorized webhook attempt from {request.remote_addr}")
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_active_processes():
    """Get list of active PM2 processes"""
    try:
        result = subprocess.run(['pm2', 'jlist'], capture_output=True, text=True)
        if result.returncode == 0:
            processes = json.loads(result.stdout)
            return [{'name': p['name'], 'status': p['pm2_env']['status']} for p in processes]
    except Exception as e:
        logger.error(f"Error getting PM2 processes: {e}")
    return []

def trigger_agent(agent_name, payload):
    """Trigger a specific agent with payload"""
    logger.info(f"Triggering agent: {agent_name} with payload: {payload}")
    # Placeholder for agent triggering logic
    # This will be implemented in later stories
    return {'status': 'triggered', 'agent': agent_name}

def update_approval_status(payload):
    """Update approval status in Google Sheets"""
    logger.info(f"Updating approval status: {payload}")
    # Placeholder for Google Sheets update logic
    # This will be implemented in later stories
    return {'status': 'updated'}

@app.route('/health', methods=['GET'])
def health_check():
    """Health endpoint for monitoring"""
    try:
        active_processes = get_active_processes()
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'server': 'webhook_server',
            'port': PORT,
            'active_processes': active_processes,
            'version': '1.0.0'
        }
        logger.debug("Health check requested")
        return jsonify(health_status), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/trigger', methods=['POST'])
@validate_request
def handle_trigger():
    """Receives real-time triggers from Google Apps Script"""
    try:
        payload = request.json
        if not payload:
            return jsonify({'error': 'No payload provided'}), 400
        
        logger.info(f"Received trigger: {json.dumps(payload)}")
        
        action = payload.get('action')
        response_data = {'status': 'received', 'action': action}
        
        if action == 'revise':
            result = trigger_agent('revision-handler', payload)
            response_data.update(result)
        elif action == 'approve':
            result = update_approval_status(payload)
            response_data.update(result)
        elif action == 'generate':
            result = trigger_agent('content-generator', payload)
            response_data.update(result)
        elif action == 'test':
            response_data['message'] = 'Test trigger received successfully'
        else:
            logger.warning(f"Unknown action: {action}")
            response_data['warning'] = f'Unknown action: {action}'
        
        response_data['timestamp'] = datetime.now().isoformat()
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error handling trigger: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'FinAdvise MVP Webhook Server',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'GET - Health check',
            '/trigger': 'POST - Webhook trigger endpoint'
        }
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info(f"Starting webhook server on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
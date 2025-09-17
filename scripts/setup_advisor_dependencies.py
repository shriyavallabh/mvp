#!/usr/bin/env python3
"""Setup dependencies for Advisor Data Manager"""

import json
import os
from datetime import datetime

def ensure_dependencies():
    """Check and create all required files/folders"""

    # 1. Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    print("✅ Created/verified data/ directory")

    # 2. Ensure config directory exists
    os.makedirs('config', exist_ok=True)
    print("✅ Created/verified config/ directory")

    # 3. Ensure traceability directory exists
    os.makedirs('traceability', exist_ok=True)
    print("✅ Created/verified traceability/ directory")

    # 4. Ensure worklog directory exists
    os.makedirs('worklog', exist_ok=True)
    print("✅ Created/verified worklog/ directory")

    # 5. Check if Google credentials exist
    creds_path = 'config/google-credentials.json'
    if not os.path.exists(creds_path):
        print("⚠️ Google credentials not found - will use sample data")
    else:
        print("✅ Google credentials found")

    # 6. Create traceability file for today
    timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M")
    today_file = f'traceability/traceability-{timestamp}.md'
    if not os.path.exists(today_file):
        with open(today_file, 'w') as f:
            f.write(f"# Traceability Matrix - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
            f.write(f"## Session: session_2025-09-17T11-34-21-000Z\n\n")
        print(f"✅ Created traceability file: {today_file}")

    # 7. Create worklog file for today
    worklog_file = f'worklog/worklog-{timestamp}.md'
    if not os.path.exists(worklog_file):
        with open(worklog_file, 'w') as f:
            f.write(f"# Worklog - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
            f.write(f"## Session: session_2025-09-17T11-34-21-000Z\n\n")
        print(f"✅ Created worklog file: {worklog_file}")

    return True

if __name__ == "__main__":
    ensure_dependencies()
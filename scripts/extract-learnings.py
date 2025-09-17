#!/usr/bin/env python3
"""
Learning Extraction System for FinAdvise Orchestration
Automatically extracts learnings from session outputs and creates learning documents
"""

import json
import os
from datetime import datetime
from pathlib import Path
import re

class LearningExtractor:
    def __init__(self, session_id):
        self.session_id = session_id
        self.output_dir = Path(f"output/{session_id}")
        self.learnings_dir = Path("learnings")
        self.learnings_dir.mkdir(exist_ok=True)
        self.learnings = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "status": "NOT_DONE",
            "insights": [],
            "failures": [],
            "improvements": [],
            "performance_metrics": {}
        }

    def extract_from_compliance(self):
        """Extract learnings from compliance validation results"""
        compliance_file = Path("data/compliance-validation.json")
        if compliance_file.exists():
            with open(compliance_file) as f:
                data = json.load(f)

            if data.get("status") == "REJECTED":
                self.learnings["failures"].append({
                    "agent": "compliance-validator",
                    "issue": "Content rejected due to compliance violations",
                    "violations": data.get("critical_violations", []),
                    "learning": "Need to embed compliance rules in content generation"
                })

            # Track compliance score
            self.learnings["performance_metrics"]["compliance_score"] = data.get("compliance_score", 0)

    def extract_from_market_intelligence(self):
        """Extract learnings from market intelligence data"""
        market_file = Path("data/market-intelligence.json")
        if market_file.exists():
            with open(market_file) as f:
                data = json.load(f)

            # Check for missing data
            missing_data = []
            if data.get("indices", {}).get("bankNifty", {}).get("value") is None:
                missing_data.append("Bank Nifty")
            if data.get("globalMarkets", {}).get("currency", {}).get("usdInr") == "Data not available in current search":
                missing_data.append("USD/INR rate")

            if missing_data:
                self.learnings["improvements"].append({
                    "area": "market-intelligence",
                    "issue": f"Missing data: {', '.join(missing_data)}",
                    "suggestion": "Implement fallback data sources"
                })

    def extract_from_outputs(self):
        """Extract learnings from generated outputs"""
        # Check LinkedIn posts
        linkedin_files = list(self.output_dir.glob("*_linkedin_*.txt"))
        whatsapp_files = list(self.output_dir.glob("*_whatsapp_*.txt"))
        image_files = list(self.output_dir.glob("*_image_*.png"))

        # Analyze content generation success
        self.learnings["performance_metrics"]["linkedin_generated"] = len(linkedin_files)
        self.learnings["performance_metrics"]["whatsapp_generated"] = len(whatsapp_files)
        self.learnings["performance_metrics"]["images_generated"] = len(image_files)

        # Check for character limit issues in WhatsApp
        for wfile in whatsapp_files:
            with open(wfile) as f:
                content = f.read()
                if len(content) > 350:
                    self.learnings["improvements"].append({
                        "area": "whatsapp-message-creator",
                        "issue": f"Message approaching character limit: {len(content)} chars",
                        "file": wfile.name,
                        "suggestion": "Optimize message length with buffer for disclaimers"
                    })

    def extract_from_errors(self):
        """Extract learnings from error logs"""
        log_dir = Path("logs")
        if log_dir.exists():
            error_files = list(log_dir.glob("*error*.log"))
            for error_file in error_files:
                with open(error_file) as f:
                    content = f.read()
                    # Look for API errors
                    if "Invalid API key" in content or "Authentication failed" in content:
                        self.learnings["failures"].append({
                            "agent": "gemini-image-generator",
                            "issue": "API authentication failed",
                            "learning": "Need API key validation on startup"
                        })

    def extract_agent_communication_issues(self):
        """Identify agent communication problems"""
        shared_context = Path("data/shared-context.json")
        if shared_context.exists():
            with open(shared_context) as f:
                data = json.load(f)
                if not data.get("agents"):
                    self.learnings["improvements"].append({
                        "area": "agent-communication",
                        "issue": "No agent communication recorded",
                        "suggestion": "Implement bidirectional communication bus"
                    })

    def calculate_success_rate(self):
        """Calculate overall success rate"""
        total_operations = 14  # Total number of agents
        successful = total_operations - len(self.learnings["failures"])
        success_rate = (successful / total_operations) * 100
        self.learnings["performance_metrics"]["success_rate"] = f"{success_rate:.0f}%"
        return success_rate

    def generate_learning_document(self):
        """Generate the learning document"""
        success_rate = self.calculate_success_rate()

        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S-000Z")
        learning_file = self.learnings_dir / f"learning_{self.session_id}.md"

        content = f"""# Learning Document - {self.session_id}

## Session Overview
- **Session ID**: {self.session_id}
- **Timestamp**: {self.learnings['timestamp']}
- **Status**: {self.learnings['status']}
- **Success Rate**: {success_rate:.0f}%

## Performance Metrics
"""
        for metric, value in self.learnings["performance_metrics"].items():
            content += f"- **{metric.replace('_', ' ').title()}**: {value}\n"

        if self.learnings["failures"]:
            content += "\n## Failures Detected\n"
            for failure in self.learnings["failures"]:
                content += f"\n### {failure.get('agent', 'Unknown Agent')}\n"
                content += f"- **Issue**: {failure.get('issue')}\n"
                if 'learning' in failure:
                    content += f"- **Learning**: {failure['learning']}\n"

        if self.learnings["improvements"]:
            content += "\n## Improvement Opportunities\n"
            for imp in self.learnings["improvements"]:
                content += f"\n### {imp.get('area', 'General')}\n"
                content += f"- **Issue**: {imp.get('issue')}\n"
                content += f"- **Suggestion**: {imp.get('suggestion')}\n"

        content += f"""
## Action Items for Learning Agent
1. Review and apply these learnings to agent prompts
2. Update configuration files based on failures
3. Implement suggested improvements
4. Mark this learning as DONE after application

## Commands
- To apply: `/learning-agent apply {self.session_id}`
- To review: `/learning-agent review {self.session_id}`
- To mark done: `/learning-agent done {self.session_id}`

---
*Extracted at: {datetime.now().isoformat()}*
"""

        with open(learning_file, 'w') as f:
            f.write(content)

        # Also save as JSON for programmatic access
        json_file = self.learnings_dir / f"learning_{self.session_id}.json"
        with open(json_file, 'w') as f:
            json.dump(self.learnings, f, indent=2)

        return learning_file

    def run(self):
        """Run the complete learning extraction"""
        print(f"🎓 Extracting learnings for session: {self.session_id}")

        # Extract from different sources
        self.extract_from_compliance()
        self.extract_from_market_intelligence()
        self.extract_from_outputs()
        self.extract_from_errors()
        self.extract_agent_communication_issues()

        # Generate document
        learning_file = self.generate_learning_document()

        print(f"✅ Learning document created: {learning_file}")
        print(f"📊 Success Rate: {self.learnings['performance_metrics'].get('success_rate', 'N/A')}")

        return learning_file

if __name__ == "__main__":
    import sys

    # Get session ID from argument or use latest
    if len(sys.argv) > 1:
        session_id = sys.argv[1]
    else:
        # Find latest session
        output_dir = Path("output")
        if output_dir.exists():
            sessions = [d.name for d in output_dir.iterdir() if d.is_dir() and d.name.startswith("session_")]
            if sessions:
                session_id = sorted(sessions)[-1]
            else:
                session_id = f"session_{datetime.now().strftime('%Y-%m-%dT%H-%M-%S-000Z')}"
        else:
            session_id = f"session_{datetime.now().strftime('%Y-%m-%dT%H-%M-%S-000Z')}"

    extractor = LearningExtractor(session_id)
    extractor.run()
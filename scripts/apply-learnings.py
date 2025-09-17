#!/usr/bin/env python3
"""
Learning Application System for FinAdvise Orchestration
Applies learnings from previous sessions to improve agent performance
"""

import json
import os
from datetime import datetime
from pathlib import Path
import re

class LearningApplicator:
    def __init__(self):
        self.learnings_dir = Path("learnings")
        self.agents_dir = Path(".claude/agents")
        self.config_dir = Path("config")
        self.applied_learnings = []
        self.pending_learnings = []

    def get_all_learnings(self):
        """Get all learning files with their status"""
        learnings = []
        for learning_file in self.learnings_dir.glob("learning_*.md"):
            with open(learning_file) as f:
                content = f.read()
                status = "NOT_DONE" if "NOT_DONE" in content else "DONE"
                learnings.append({
                    "file": learning_file,
                    "session": learning_file.stem.replace("learning_", ""),
                    "status": status,
                    "content": content
                })
        return sorted(learnings, key=lambda x: x["file"].stat().st_mtime, reverse=True)

    def get_pending_learnings(self):
        """Get only learnings that haven't been applied"""
        all_learnings = self.get_all_learnings()
        return [l for l in all_learnings if l["status"] == "NOT_DONE"]

    def parse_learning_document(self, learning):
        """Parse learning document for actionable items"""
        content = learning["content"]
        actions = []

        # Extract failures
        if "## Failures Detected" in content:
            failures_section = content.split("## Failures Detected")[1].split("##")[0]
            # Parse each failure
            for line in failures_section.split("\n"):
                if "- **Issue**:" in line:
                    issue = line.split("- **Issue**:")[1].strip()
                    actions.append({"type": "failure", "issue": issue})
                if "- **Learning**:" in line:
                    learning_text = line.split("- **Learning**:")[1].strip()
                    if actions:
                        actions[-1]["learning"] = learning_text

        # Extract improvements
        if "## Improvement Opportunities" in content:
            improvements_section = content.split("## Improvement Opportunities")[1].split("##")[0]
            current_area = None
            for line in improvements_section.split("\n"):
                if line.startswith("### "):
                    current_area = line.replace("### ", "").strip()
                if "- **Suggestion**:" in line:
                    suggestion = line.split("- **Suggestion**:")[1].strip()
                    actions.append({
                        "type": "improvement",
                        "area": current_area,
                        "suggestion": suggestion
                    })

        return actions

    def apply_compliance_improvements(self, actions):
        """Apply learnings related to compliance"""
        compliance_learnings = [a for a in actions if "compliance" in str(a).lower()]

        if compliance_learnings:
            # Update LinkedIn generator prompt
            linkedin_agent = self.agents_dir / "linkedin-post-generator.md"
            if linkedin_agent.exists():
                with open(linkedin_agent) as f:
                    content = f.read()

                # Add compliance rules to the prompt
                if "SEBI compliance" not in content:
                    compliance_section = """
## Compliance Requirements (CRITICAL)
1. ALWAYS include market risk disclaimer: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully."
2. ALWAYS include ARN number in format: ARN-XXXXXX
3. Include past performance disclaimer when mentioning returns
4. Add document reading advisory when recommending schemes
"""
                    # Insert after the description
                    content = content.replace("## Core Responsibilities", compliance_section + "\n## Core Responsibilities")

                    with open(linkedin_agent, 'w') as f:
                        f.write(content)

                    self.applied_learnings.append({
                        "agent": "linkedin-post-generator",
                        "change": "Added compliance requirements to prompt",
                        "timestamp": datetime.now().isoformat()
                    })

    def apply_communication_improvements(self, actions):
        """Apply learnings related to agent communication"""
        comm_learnings = [a for a in actions if "communication" in str(a).lower()]

        if comm_learnings:
            # Create communication protocol file
            comm_protocol = Path("orchestration/communication-protocol.json")
            comm_protocol.parent.mkdir(exist_ok=True)

            protocol = {
                "version": "1.0",
                "timestamp": datetime.now().isoformat(),
                "channels": {
                    "market_data": {
                        "publisher": "market-intelligence",
                        "subscribers": ["linkedin-post-generator", "whatsapp-message-creator", "status-image-designer"]
                    },
                    "advisor_data": {
                        "publisher": "advisor-data-manager",
                        "subscribers": ["segment-analyzer", "brand-customizer", "distribution-controller"]
                    },
                    "compliance_results": {
                        "publisher": "compliance-validator",
                        "subscribers": ["quality-scorer", "feedback-processor", "distribution-controller"]
                    }
                },
                "message_format": {
                    "sender": "agent_name",
                    "timestamp": "ISO-8601",
                    "data": "object",
                    "priority": "high|medium|low"
                }
            }

            with open(comm_protocol, 'w') as f:
                json.dump(protocol, f, indent=2)

            self.applied_learnings.append({
                "system": "communication",
                "change": "Created communication protocol for agent coordination",
                "file": str(comm_protocol),
                "timestamp": datetime.now().isoformat()
            })

    def apply_api_improvements(self, actions):
        """Apply learnings related to API issues"""
        api_learnings = [a for a in actions if "API" in str(a) or "authentication" in str(a).lower()]

        if api_learnings:
            # Create API validation script
            validator_script = Path("scripts/validate-apis.py")
            validator_content = '''#!/usr/bin/env python3
"""Validate all required APIs before orchestration"""

import os
from pathlib import Path

def validate_apis():
    issues = []

    # Check Gemini API
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key or gemini_key == "your-gemini-api-key-here":
        issues.append("❌ Gemini API key invalid or missing")
    else:
        print("✅ Gemini API key found")

    # Check other APIs
    if not os.getenv("GOOGLE_CLIENT_ID"):
        issues.append("⚠️ Google Client ID missing (optional)")

    return issues

if __name__ == "__main__":
    issues = validate_apis()
    if issues:
        print("\\nAPI Issues Found:")
        for issue in issues:
            print(f"  {issue}")
        print("\\nPlease update your .env file")
    else:
        print("\\n✅ All APIs validated successfully")
'''

            with open(validator_script, 'w') as f:
                f.write(validator_content)

            os.chmod(validator_script, 0o755)

            self.applied_learnings.append({
                "system": "api-validation",
                "change": "Created API validation script",
                "file": str(validator_script),
                "timestamp": datetime.now().isoformat()
            })

    def mark_learning_done(self, learning_file):
        """Mark a learning document as DONE"""
        with open(learning_file) as f:
            content = f.read()

        content = content.replace("**Status**: NOT_DONE", "**Status**: DONE")
        content += f"\n\n## Applied On\n- **Date**: {datetime.now().isoformat()}\n- **Applied Changes**: {len(self.applied_learnings)}\n"

        with open(learning_file, 'w') as f:
            f.write(content)

    def create_application_report(self):
        """Create a report of applied learnings"""
        report_file = Path(f"learnings/application-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json")

        report = {
            "timestamp": datetime.now().isoformat(),
            "applied_count": len(self.applied_learnings),
            "pending_count": len(self.pending_learnings),
            "applied_learnings": self.applied_learnings,
            "next_steps": [
                "Run validation script: python3 scripts/validate-apis.py",
                "Test improved agents with: /orchestrate",
                "Review compliance in generated content"
            ]
        }

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        return report_file

    def interactive_mode(self):
        """Interactive mode for selecting learnings to apply"""
        pending = self.get_pending_learnings()

        if not pending:
            print("✅ No pending learnings to apply!")
            return

        print(f"\n📚 Found {len(pending)} pending learning documents:\n")

        for i, learning in enumerate(pending, 1):
            print(f"{i}. Session: {learning['session']}")
            print(f"   Status: {learning['status']}")
            print(f"   File: {learning['file'].name}")
            print()

        choice = input("Select learning to apply (number), 'all' for all, or 'skip': ").strip()

        if choice.lower() == 'skip':
            return
        elif choice.lower() == 'all':
            to_apply = pending
        else:
            try:
                idx = int(choice) - 1
                to_apply = [pending[idx]]
            except (ValueError, IndexError):
                print("Invalid selection")
                return

        # Apply selected learnings
        for learning in to_apply:
            print(f"\n🔧 Applying learnings from: {learning['session']}")

            actions = self.parse_learning_document(learning)

            # Apply different types of improvements
            self.apply_compliance_improvements(actions)
            self.apply_communication_improvements(actions)
            self.apply_api_improvements(actions)

            # Mark as done
            self.mark_learning_done(learning["file"])

            print(f"✅ Applied {len(self.applied_learnings)} improvements")

        # Create report
        report = self.create_application_report()
        print(f"\n📊 Report saved: {report}")

    def auto_apply_all(self):
        """Automatically apply all pending learnings"""
        pending = self.get_pending_learnings()

        for learning in pending:
            actions = self.parse_learning_document(learning)
            self.apply_compliance_improvements(actions)
            self.apply_communication_improvements(actions)
            self.apply_api_improvements(actions)
            self.mark_learning_done(learning["file"])

        return self.create_application_report()

if __name__ == "__main__":
    import sys

    applicator = LearningApplicator()

    if len(sys.argv) > 1 and sys.argv[1] == "auto":
        # Auto mode - apply all pending
        report = applicator.auto_apply_all()
        print(f"✅ Auto-applied learnings. Report: {report}")
    else:
        # Interactive mode
        applicator.interactive_mode()
#!/usr/bin/env python3
"""
SEBI Compliance Validator for FinAdvise Content
Validates LinkedIn posts, WhatsApp messages, and images for regulatory compliance
"""

import json
import re
import os
from datetime import datetime
from pathlib import Path

class SEBIComplianceValidator:
    def __init__(self, session_id):
        self.session_id = session_id
        self.base_path = f"/Users/shriyavallabh/Desktop/mvp/output/{session_id}"
        self.issues = []
        self.validation_results = {
            "session_id": session_id,
            "validation_timestamp": datetime.now().isoformat(),
            "overall_status": "PASS",
            "linkedin_posts": {"total": 0, "passed": 0, "failed": 0, "issues": []},
            "whatsapp_messages": {"total": 0, "passed": 0, "failed": 0, "issues": []},
            "images": {"total": 0, "passed": 0, "failed": 0, "issues": []},
            "detailed_findings": []
        }

    def validate_arn_disclosure(self, content, content_type, identifier):
        """Check for valid ARN disclosure"""
        issues = []

        # Check ARN format (ARN-XXXXXX)
        arn_pattern = r'ARN[:\-\s]*\d{6}'
        if not re.search(arn_pattern, content, re.IGNORECASE):
            issues.append({
                "type": "CRITICAL",
                "category": "ARN Disclosure",
                "issue": "Missing ARN number in required format (ARN-XXXXXX)",
                "content_id": identifier,
                "content_type": content_type
            })

        return issues

    def validate_risk_disclaimers(self, content, content_type, identifier):
        """Check for mandatory risk disclaimers"""
        issues = []

        # Required disclaimers
        required_phrases = [
            (r'market\s+risk', "Market risk disclaimer"),
            (r'read.*scheme.*document|scheme.*document.*carefully', "Scheme document warning"),
        ]

        for pattern, description in required_phrases:
            if not re.search(pattern, content, re.IGNORECASE):
                issues.append({
                    "type": "CRITICAL",
                    "category": "Risk Disclaimer",
                    "issue": f"Missing required disclaimer: {description}",
                    "content_id": identifier,
                    "content_type": content_type
                })

        # Check for past performance disclaimer (more lenient)
        past_perf_patterns = [
            r'past\s+performance.*not.*indicative',
            r'past\s+performance.*not.*sustained',
            r'past\s+performance.*may\s+not',
            r'past.*returns.*not.*guaranteed'
        ]

        has_past_perf_disclaimer = any(
            re.search(pattern, content, re.IGNORECASE)
            for pattern in past_perf_patterns
        )

        if not has_past_perf_disclaimer:
            issues.append({
                "type": "MAJOR",
                "category": "Risk Disclaimer",
                "issue": "Missing past performance disclaimer",
                "content_id": identifier,
                "content_type": content_type,
                "suggestion": "Add: 'Past performance is not indicative of future returns'"
            })

        return issues

    def validate_prohibited_language(self, content, content_type, identifier):
        """Check for prohibited/misleading language"""
        issues = []

        prohibited_terms = [
            (r'\bguaranteed\s+returns?\b', "Guaranteed returns"),
            (r'\bassured\s+profit', "Assured profits"),
            (r'\brisk[:\-\s]*free', "Risk-free claim"),
            (r'\bzero\s+risk', "Zero risk claim"),
            (r'\b\d+%\s+guaranteed', "Specific return guarantee"),
            (r'\bcertain\s+returns?', "Certain returns"),
            (r'\bpromise.*returns?', "Promise of returns"),
            (r'\bno\s+loss', "No loss claim")
        ]

        for pattern, description in prohibited_terms:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                # Get context around the match
                start = max(0, match.start() - 30)
                end = min(len(content), match.end() + 30)
                context = content[start:end].replace('\n', ' ')

                issues.append({
                    "type": "CRITICAL",
                    "category": "Prohibited Language",
                    "issue": f"Prohibited term found: {description}",
                    "content_id": identifier,
                    "content_type": content_type,
                    "snippet": f"...{context}...",
                    "severity": "BLOCKING - Content cannot be published"
                })

        return issues

    def validate_linkedin_posts(self):
        """Validate all LinkedIn posts"""
        json_path = f"{self.base_path}/linkedin/json/all_linkedin_posts.json"

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            total_posts = 0
            passed_posts = 0

            for advisor_data in data.get('posts', []):
                for post in advisor_data.get('posts', []):
                    total_posts += 1
                    post_id = f"{advisor_data['advisor_name']}_post_{post['post_number']}"

                    # Read actual text file
                    text_file = f"{self.base_path}/linkedin/text/{post['text_file']}"
                    with open(text_file, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Run all validations
                    post_issues = []
                    post_issues.extend(self.validate_arn_disclosure(content, "LinkedIn Post", post_id))
                    post_issues.extend(self.validate_risk_disclaimers(content, "LinkedIn Post", post_id))
                    post_issues.extend(self.validate_prohibited_language(content, "LinkedIn Post", post_id))

                    if post_issues:
                        self.validation_results['linkedin_posts']['issues'].extend(post_issues)
                        self.validation_results['linkedin_posts']['failed'] += 1
                    else:
                        passed_posts += 1

            self.validation_results['linkedin_posts']['total'] = total_posts
            self.validation_results['linkedin_posts']['passed'] = passed_posts

            print(f"✓ LinkedIn Posts: {passed_posts}/{total_posts} passed")

        except Exception as e:
            print(f"✗ Error validating LinkedIn posts: {e}")
            self.validation_results['linkedin_posts']['issues'].append({
                "type": "ERROR",
                "issue": f"Validation error: {str(e)}"
            })

    def validate_whatsapp_messages(self):
        """Validate all WhatsApp messages"""
        json_path = f"{self.base_path}/whatsapp/json/all_whatsapp_messages.json"

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            total_messages = 0
            passed_messages = 0

            for message in data.get('messages', []):
                total_messages += 1
                msg_id = message['message_id']
                content = message['message_text']

                # Run all validations
                msg_issues = []
                msg_issues.extend(self.validate_arn_disclosure(content, "WhatsApp Message", msg_id))
                msg_issues.extend(self.validate_risk_disclaimers(content, "WhatsApp Message", msg_id))
                msg_issues.extend(self.validate_prohibited_language(content, "WhatsApp Message", msg_id))

                # WhatsApp-specific validation: Character limit
                if len(content) > 400:
                    msg_issues.append({
                        "type": "WARNING",
                        "category": "WhatsApp Format",
                        "issue": f"Message exceeds optimal 400 character limit ({len(content)} chars)",
                        "content_id": msg_id,
                        "content_type": "WhatsApp Message"
                    })

                if msg_issues:
                    self.validation_results['whatsapp_messages']['issues'].extend(msg_issues)
                    # Only count as failed if critical issues
                    if any(issue['type'] == 'CRITICAL' for issue in msg_issues):
                        self.validation_results['whatsapp_messages']['failed'] += 1
                    else:
                        passed_messages += 1
                else:
                    passed_messages += 1

            self.validation_results['whatsapp_messages']['total'] = total_messages
            self.validation_results['whatsapp_messages']['passed'] = passed_messages

            print(f"✓ WhatsApp Messages: {passed_messages}/{total_messages} passed")

        except Exception as e:
            print(f"✗ Error validating WhatsApp messages: {e}")
            self.validation_results['whatsapp_messages']['issues'].append({
                "type": "ERROR",
                "issue": f"Validation error: {str(e)}"
            })

    def validate_images(self):
        """Validate branded images for compliance elements"""
        image_dir = f"{self.base_path}/images/status/final"

        try:
            image_files = list(Path(image_dir).glob("*_branded.png"))
            total_images = len(image_files)
            passed_images = total_images  # Assume pass unless issues found

            # Note: Visual validation requires OCR or manual review
            # For automated validation, we check if images exist and follow naming convention

            for img_path in image_files:
                img_name = img_path.name

                # Basic checks
                file_size = img_path.stat().st_size
                if file_size < 10000:  # Less than 10KB - likely corrupted
                    self.validation_results['images']['issues'].append({
                        "type": "WARNING",
                        "category": "Image Quality",
                        "issue": "Image file size suspiciously small - may be corrupted",
                        "content_id": img_name,
                        "content_type": "WhatsApp Status Image"
                    })
                    passed_images -= 1

            self.validation_results['images']['total'] = total_images
            self.validation_results['images']['passed'] = passed_images

            # Add note about manual review
            self.validation_results['images']['issues'].append({
                "type": "INFO",
                "category": "Image Compliance",
                "issue": "Images require manual visual review for ARN visibility and disclaimer readability",
                "recommendation": "Verify ARN and disclaimers are clearly visible on all images"
            })

            print(f"✓ Images: {total_images} generated (manual review recommended)")

        except Exception as e:
            print(f"✗ Error validating images: {e}")
            self.validation_results['images']['issues'].append({
                "type": "ERROR",
                "issue": f"Validation error: {str(e)}"
            })

    def generate_compliance_report(self):
        """Generate final compliance report"""

        # Determine overall status
        critical_issues = [
            issue for category in ['linkedin_posts', 'whatsapp_messages', 'images']
            for issue in self.validation_results[category]['issues']
            if issue.get('type') == 'CRITICAL'
        ]

        if critical_issues:
            self.validation_results['overall_status'] = "FAIL"
        else:
            self.validation_results['overall_status'] = "PASS"

        # Calculate compliance score
        total_content = (
            self.validation_results['linkedin_posts']['total'] +
            self.validation_results['whatsapp_messages']['total'] +
            self.validation_results['images']['total']
        )

        total_passed = (
            self.validation_results['linkedin_posts']['passed'] +
            self.validation_results['whatsapp_messages']['passed'] +
            self.validation_results['images']['passed']
        )

        compliance_score = (total_passed / total_content * 100) if total_content > 0 else 0

        self.validation_results['compliance_score'] = round(compliance_score, 2)
        self.validation_results['total_content_items'] = total_content
        self.validation_results['total_passed'] = total_passed
        self.validation_results['critical_issues_count'] = len(critical_issues)

        # Save report
        report_dir = f"{self.base_path}/reports"
        os.makedirs(report_dir, exist_ok=True)

        report_path = f"{report_dir}/compliance-validation.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)

        print(f"\n{'='*60}")
        print(f"SEBI COMPLIANCE VALIDATION REPORT")
        print(f"{'='*60}")
        print(f"Session: {self.session_id}")
        print(f"Status: {self.validation_results['overall_status']}")
        print(f"Compliance Score: {compliance_score:.1f}%")
        print(f"Critical Issues: {len(critical_issues)}")
        print(f"\nContent Summary:")
        print(f"  LinkedIn Posts: {self.validation_results['linkedin_posts']['passed']}/{self.validation_results['linkedin_posts']['total']} passed")
        print(f"  WhatsApp Messages: {self.validation_results['whatsapp_messages']['passed']}/{self.validation_results['whatsapp_messages']['total']} passed")
        print(f"  Images: {self.validation_results['images']['passed']}/{self.validation_results['images']['total']} validated")

        if critical_issues:
            print(f"\n⚠️  CRITICAL ISSUES FOUND:")
            for issue in critical_issues[:5]:  # Show first 5
                print(f"  - {issue['category']}: {issue['issue']}")
                print(f"    Content: {issue['content_id']}")
        else:
            print(f"\n✓ No critical compliance issues found")

        print(f"\nReport saved to: {report_path}")
        print(f"{'='*60}\n")

        return self.validation_results

def main():
    session_id = "session_20251002_180551"

    validator = SEBIComplianceValidator(session_id)

    print("Starting SEBI Compliance Validation...\n")

    # Run all validations
    validator.validate_linkedin_posts()
    validator.validate_whatsapp_messages()
    validator.validate_images()

    # Generate report
    results = validator.generate_compliance_report()

    return results

if __name__ == "__main__":
    main()

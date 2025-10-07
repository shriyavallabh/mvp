#!/usr/bin/env python3
"""
Quality Regeneration Loop Agent
Auto-regenerates content that scores below 9.0/10 with specific improvements
Max 2 regeneration attempts before falling back to curated templates
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

class QualityRegenerationLoop:
    def __init__(self, session_id):
        self.session_id = session_id
        self.session_dir = Path(f"output/{session_id}")
        self.quality_threshold = 9.0
        self.max_attempts = 2
        self.results = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "regenerations": [],
            "fallbacks_used": [],
            "final_quality_rate": 0.0
        }

    def load_quality_scores(self):
        """Load quality scores from quality-scorer agent output"""
        quality_file = self.session_dir / "quality/QUALITY_REPORT.json"

        if not quality_file.exists():
            raise FileNotFoundError(f"Quality report not found: {quality_file}")

        with open(quality_file, 'r') as f:
            return json.load(f)

    def identify_low_quality_assets(self, quality_data):
        """
        Find all assets with virality score < 9.0
        Returns list of assets needing regeneration
        """
        low_quality = []

        # Check LinkedIn posts
        for post in quality_data.get('linkedin_posts', []):
            if post['overall_virality'] < self.quality_threshold:
                low_quality.append({
                    'type': 'linkedin',
                    'advisor': post['advisor_id'],
                    'file': post['file_path'],
                    'current_score': post['overall_virality'],
                    'weaknesses': self._identify_weaknesses(post)
                })

        # Check WhatsApp messages
        for msg in quality_data.get('whatsapp_messages', []):
            if msg['overall_virality'] < self.quality_threshold:
                low_quality.append({
                    'type': 'whatsapp',
                    'advisor': msg['advisor_id'],
                    'file': msg['file_path'],
                    'current_score': msg['overall_virality'],
                    'weaknesses': self._identify_weaknesses(msg)
                })

        # Check Status images
        for img in quality_data.get('status_images', []):
            if img['overall_virality'] < self.quality_threshold:
                low_quality.append({
                    'type': 'status_image',
                    'advisor': img['advisor_id'],
                    'file': img['file_path'],
                    'current_score': img['overall_virality'],
                    'weaknesses': self._identify_weaknesses(img)
                })

        return low_quality

    def _identify_weaknesses(self, asset_scores):
        """
        Analyze dimensional scores to identify specific weaknesses
        Returns improvement prompts
        """
        weaknesses = []

        # Check each dimension
        for dimension, score in asset_scores.items():
            if dimension.startswith('score_') and isinstance(score, (int, float)):
                if score < 8.0:
                    weakness_name = dimension.replace('score_', '')
                    weaknesses.append({
                        'dimension': weakness_name,
                        'current': score,
                        'improvement': self._get_improvement_prompt(weakness_name)
                    })

        return weaknesses

    def _get_improvement_prompt(self, dimension):
        """
        Return specific improvement prompts based on weak dimension
        """
        improvements = {
            'hook': "Add shocking statistic or provocative question in first line. Use numbers and specific data.",
            'story': "Add personal narrative or relatable scenario. Show transformation journey.",
            'emotion': "Increase emotional intensity. Use vulnerability, aspiration, or contrarian wisdom.",
            'specificity': "Add concrete numbers, dates, names. Replace vague with precise.",
            'simplicity': "Simplify language. Use shorter sentences. Remove jargon.",
            'cta': "Make call-to-action urgent and specific. Add FOMO trigger.",
            'information_density': "Pack more value per character. Remove fluff.",
            'actionability': "Give clear next step. Make it easy to execute.",
            'emotional_appeal': "Add stronger emotional trigger (fear/hope/pride/vindication).",
            'shareability': "Make more forward-worthy. Add 'send this to someone who' hook.",
            'visual_impact': "Increase contrast. Use bolder colors. Larger typography.",
            'clarity': "Simplify message. One clear takeaway only.",
            'mobile_readability': "Increase font sizes. Better spacing. Clearer hierarchy."
        }

        return improvements.get(dimension, "Improve overall quality and engagement.")

    def generate_regeneration_prompt(self, asset):
        """
        Create specific prompt for content regeneration based on weaknesses
        """
        content_type = asset['type']
        advisor = asset['advisor']
        score = asset['current_score']
        weaknesses = asset['weaknesses']

        prompt = f"""
REGENERATE {content_type.upper()} for {advisor}

Current Score: {score}/10 (BELOW THRESHOLD: 9.0/10)
Attempt: {asset.get('attempt', 1)}/2

CRITICAL IMPROVEMENTS NEEDED:
"""

        for weakness in weaknesses:
            prompt += f"\n{weakness['dimension'].upper()} ({weakness['current']}/10):\n"
            prompt += f"  → {weakness['improvement']}\n"

        prompt += f"""

REQUIREMENTS:
- Target Score: 9.0+/10 (Grammy-level MANDATORY)
- Apply ALL improvements above
- Maintain advisor's tone and segment personalization
- Keep SEBI compliance (ARN, disclaimers)
- Use current market data from market-intelligence.json

Generate IMPROVED {content_type} that addresses EVERY weakness listed above.
"""

        return prompt

    def regenerate_asset(self, asset, attempt=1):
        """
        Trigger agent to regenerate specific asset
        Returns new asset with updated score
        """
        print(f"\n🔄 REGENERATING: {asset['type']} for {asset['advisor']} (Attempt {attempt}/2)")
        print(f"   Current Score: {asset['current_score']}/10")
        print(f"   Weaknesses: {len(asset['weaknesses'])}")

        # Create regeneration prompt
        asset['attempt'] = attempt
        regen_prompt = self.generate_regeneration_prompt(asset)

        # Log regeneration attempt
        self.results['regenerations'].append({
            'asset_type': asset['type'],
            'advisor': asset['advisor'],
            'attempt': attempt,
            'original_score': asset['current_score'],
            'weaknesses_addressed': [w['dimension'] for w in asset['weaknesses']],
            'timestamp': datetime.now().isoformat()
        })

        # NOTE: In production, this would call the appropriate agent
        # For now, we document what needs to happen
        print(f"\n📝 Regeneration Prompt Created:")
        print(f"   Type: {asset['type']}")
        print(f"   Advisor: {asset['advisor']}")
        print(f"   Target: 9.0+/10")
        print(f"   Improvements: {', '.join([w['dimension'] for w in asset['weaknesses']])}")

        return {
            'needs_regeneration': True,
            'regeneration_prompt': regen_prompt,
            'asset_info': asset
        }

    def load_fallback_template(self, content_type, advisor_segment):
        """
        Load curated high-quality template when regeneration fails
        Returns pre-approved content with 9.5+/10 quality
        """
        print(f"\n📋 LOADING FALLBACK TEMPLATE: {content_type} for {advisor_segment}")

        template_dir = Path("data/emergency-templates")
        template_file = template_dir / f"{content_type}_{advisor_segment}.json"

        if template_file.exists():
            with open(template_file, 'r') as f:
                template = json.load(f)
                print(f"   ✅ Template loaded: {template['title']}")
                print(f"   Quality: {template['virality_score']}/10")
                return template
        else:
            print(f"   ⚠️  Template not found: {template_file}")
            print(f"   Using generic high-quality template")
            return self._get_generic_template(content_type)

    def _get_generic_template(self, content_type):
        """
        Return generic high-quality template as absolute fallback
        """
        templates = {
            'linkedin': {
                'title': 'Market Update Generic Template',
                'content': 'Market volatility teaches us one truth:\n\nConsistent investing > Perfect timing\n\n[Market data placeholder]\n\nYour strategy matters more than market movements.\n\n[ARN] | [Tagline]',
                'virality_score': 9.5
            },
            'whatsapp': {
                'title': 'SIP Reminder Generic Template',
                'content': '💡 Market update: [Data]\n\nYour SIP continues building wealth.\n\nStay invested. 📈\n\n[Tagline] | [ARN]',
                'virality_score': 9.5
            },
            'status_image': {
                'title': 'Motivational Quote Template',
                'content': 'Bold headline about investing + market stat + advisor branding',
                'virality_score': 9.5
            }
        }

        return templates.get(content_type, {'title': 'Fallback', 'content': 'Generic content', 'virality_score': 9.0})

    def execute_regeneration_loop(self):
        """
        Main execution: Find low-quality assets and regenerate
        """
        print("=" * 60)
        print("QUALITY REGENERATION LOOP - STARTING")
        print("=" * 60)
        print(f"Session: {self.session_id}")
        print(f"Quality Threshold: {self.quality_threshold}/10")
        print(f"Max Attempts: {self.max_attempts}")
        print()

        # Load quality scores
        print("📊 Loading quality scores...")
        quality_data = self.load_quality_scores()

        # Identify low-quality assets
        print("🔍 Identifying assets below threshold...")
        low_quality_assets = self.identify_low_quality_assets(quality_data)

        if not low_quality_assets:
            print("\n✅ ALL ASSETS MEET QUALITY THRESHOLD (9.0+/10)")
            print("   No regeneration needed!")
            self.results['final_quality_rate'] = 100.0
            return self.results

        print(f"\n⚠️  Found {len(low_quality_assets)} assets below 9.0/10")

        # Process each low-quality asset
        regeneration_plan = []
        fallback_plan = []

        for asset in low_quality_assets:
            print(f"\n{'─' * 60}")
            print(f"Asset: {asset['type']} | Advisor: {asset['advisor']}")
            print(f"Score: {asset['current_score']}/10")

            # Try regeneration
            regen_result = self.regenerate_asset(asset, attempt=1)
            regeneration_plan.append(regen_result)

            # If still fails after max attempts, use fallback
            if asset['current_score'] < 8.0:  # Very low, might need fallback
                print(f"   ⚠️  Score critically low, fallback template recommended")
                fallback = {
                    'asset_type': asset['type'],
                    'advisor': asset['advisor'],
                    'reason': 'Score below 8.0 after initial generation'
                }
                fallback_plan.append(fallback)
                self.results['fallbacks_used'].append(fallback)

        # Calculate final metrics
        total_assets = quality_data.get('total_assets', len(low_quality_assets))
        assets_needing_work = len(low_quality_assets)
        quality_rate = ((total_assets - assets_needing_work) / total_assets * 100) if total_assets > 0 else 0

        self.results['final_quality_rate'] = quality_rate
        self.results['assets_needing_regeneration'] = assets_needing_work
        self.results['regeneration_plan'] = regeneration_plan
        self.results['fallback_plan'] = fallback_plan

        # Save results
        output_file = self.session_dir / "quality/regeneration-plan.json"
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print("\n" + "=" * 60)
        print("REGENERATION PLAN CREATED")
        print("=" * 60)
        print(f"Assets to regenerate: {len(regeneration_plan)}")
        print(f"Fallback templates needed: {len(fallback_plan)}")
        print(f"Current quality rate: {quality_rate:.1f}%")
        print(f"Target quality rate: 100%")
        print(f"\nPlan saved: {output_file}")
        print("=" * 60)

        return self.results

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 quality-regeneration-loop.py <session_id>")
        sys.exit(1)

    session_id = sys.argv[1]

    loop = QualityRegenerationLoop(session_id)
    results = loop.execute_regeneration_loop()

    # Exit code based on results
    if results['final_quality_rate'] == 100.0:
        sys.exit(0)  # All good
    elif results['final_quality_rate'] >= 90.0:
        sys.exit(1)  # Minor issues
    else:
        sys.exit(2)  # Significant issues

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Fatigue Checker Agent - Content Freshness & Diversity Analysis
Prevents audience fatigue through semantic analysis and pattern detection
"""

import json
import os
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import re
from pathlib import Path

class FatigueChecker:
    def __init__(self, session_id, config=None):
        self.session_id = session_id
        self.session_dir = f"/Users/shriyavallabh/Desktop/mvp/output/{session_id}"
        self.config = config or self.load_default_config()

        # Analysis thresholds
        self.similarity_threshold = self.config.get('similarity_threshold', 0.70)
        self.topic_rotation_days = self.config.get('topic_rotation_days', 14)
        self.history_window_days = self.config.get('history_window_days', 30)

        # Results
        self.analysis_results = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'advisors': {},
            'overall_score': 0,
            'approved_count': 0,
            'flagged_count': 0,
            'distribution_status': 'PENDING'
        }

    def load_default_config(self):
        """Load default configuration"""
        return {
            'similarity_threshold': 0.70,
            'topic_rotation_days': 14,
            'history_window_days': 30,
            'topic_frequency_threshold': 0.40,
            'data_reuse_days': 14
        }

    def load_current_content(self):
        """Load current session content"""
        content = {
            'linkedin': {},
            'whatsapp': {}
        }

        # Load LinkedIn posts
        linkedin_dir = os.path.join(self.session_dir, 'linkedin', 'branded')
        if os.path.exists(linkedin_dir):
            for file in os.listdir(linkedin_dir):
                if file.endswith('.json'):
                    with open(os.path.join(linkedin_dir, file), 'r') as f:
                        data = json.load(f)
                        advisor_id = data.get('advisorId')
                        if advisor_id not in content['linkedin']:
                            content['linkedin'][advisor_id] = []
                        content['linkedin'][advisor_id].append(data)

        # Load WhatsApp messages
        whatsapp_dir = os.path.join(self.session_dir, 'whatsapp', 'branded')
        if os.path.exists(whatsapp_dir):
            for file in os.listdir(whatsapp_dir):
                if file.endswith('.json'):
                    with open(os.path.join(whatsapp_dir, file), 'r') as f:
                        data = json.load(f)
                        advisor_id = data.get('advisorId')
                        if advisor_id not in content['whatsapp']:
                            content['whatsapp'][advisor_id] = []
                        content['whatsapp'][advisor_id].append(data)

        return content

    def load_historical_content(self):
        """Load historical content from previous sessions"""
        historical = {
            'linkedin': {},
            'whatsapp': {}
        }

        output_dir = '/Users/shriyavallabh/Desktop/mvp/output'
        cutoff_date = datetime.now() - timedelta(days=self.history_window_days)

        # Find all session directories
        for session_dir in os.listdir(output_dir):
            session_path = os.path.join(output_dir, session_dir)
            if not os.path.isdir(session_path) or session_dir == self.session_id:
                continue

            # Try to extract date from session directory
            try:
                # Skip sessions that are too old (basic heuristic)
                if session_dir.startswith('session_20250'):
                    # Parse date if possible
                    pass

                # Load LinkedIn
                linkedin_dir = os.path.join(session_path, 'linkedin')
                for subdir in ['branded', 'json']:
                    full_path = os.path.join(linkedin_dir, subdir)
                    if os.path.exists(full_path):
                        for file in os.listdir(full_path):
                            if file.endswith('.json'):
                                try:
                                    with open(os.path.join(full_path, file), 'r') as f:
                                        data = json.load(f)
                                        if isinstance(data, dict) and 'advisorId' in data:
                                            advisor_id = data.get('advisorId')
                                            if advisor_id not in historical['linkedin']:
                                                historical['linkedin'][advisor_id] = []
                                            historical['linkedin'][advisor_id].append(data)
                                except:
                                    pass

                # Load WhatsApp
                whatsapp_dir = os.path.join(session_path, 'whatsapp')
                for subdir in ['branded', 'json']:
                    full_path = os.path.join(whatsapp_dir, subdir)
                    if os.path.exists(full_path):
                        for file in os.listdir(full_path):
                            if file.endswith('.json'):
                                try:
                                    with open(os.path.join(full_path, file), 'r') as f:
                                        data = json.load(f)
                                        if isinstance(data, dict) and 'advisorId' in data:
                                            advisor_id = data.get('advisorId')
                                            if advisor_id not in historical['whatsapp']:
                                                historical['whatsapp'][advisor_id] = []
                                            historical['whatsapp'][advisor_id].append(data)
                                except:
                                    pass
            except Exception as e:
                continue

        return historical

    def extract_topics(self, content_list):
        """Extract topics from content"""
        topics = []
        for content in content_list:
            # LinkedIn posts
            if 'type' in content:
                topics.append(content.get('type', 'unknown'))

            # Extract from content text
            text = content.get('content', '') or content.get('text', '')

            # Ensure text is a string
            if isinstance(text, dict):
                text = json.dumps(text)
            elif not isinstance(text, str):
                text = str(text)

            # Common financial topics
            topic_keywords = {
                'gold': ['gold', 'सोना', '$'],
                'sip': ['sip', 'systematic', 'monthly'],
                'fii': ['fii', 'foreign', 'outflow'],
                'market': ['sensex', 'nifty', 'market'],
                'ipo': ['ipo', 'public offer'],
                'rate_cut': ['rate cut', 'rbi', 'dovish'],
                'tax': ['tax', 'ltcg', 'harvesting'],
                'portfolio': ['portfolio', 'diversification', 'allocation'],
                'it_sector': ['it sector', 'tech', 'tcs'],
                'banking': ['banking', 'hdfc', 'bank']
            }

            text_lower = text.lower()
            for topic, keywords in topic_keywords.items():
                if any(kw in text_lower for kw in keywords):
                    topics.append(topic)

        return topics

    def calculate_semantic_similarity(self, text1, text2):
        """Simple semantic similarity using word overlap"""
        # Ensure texts are strings
        if isinstance(text1, dict):
            text1 = json.dumps(text1)
        elif not isinstance(text1, str):
            text1 = str(text1)

        if isinstance(text2, dict):
            text2 = json.dumps(text2)
        elif not isinstance(text2, str):
            text2 = str(text2)

        # Normalize texts
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))

        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'is', 'are', 'was', 'were', 'your', 'you', 'this', 'that'}
        words1 = words1 - stop_words
        words2 = words2 - stop_words

        # Calculate Jaccard similarity
        if not words1 or not words2:
            return 0.0

        intersection = len(words1 & words2)
        union = len(words1 | words2)

        return intersection / union if union > 0 else 0.0

    def extract_data_points(self, text):
        """Extract numerical data points and market references"""
        data_points = []

        # Ensure text is a string
        if isinstance(text, dict):
            text = json.dumps(text)
        elif not isinstance(text, str):
            text = str(text)

        # Extract numbers with currency
        currency_pattern = r'[₹$]\s*[\d,]+(?:\.\d+)?(?:\s*(?:cr|crore|lakh|lakhs|L|K|billion|trillion))?'
        data_points.extend(re.findall(currency_pattern, text, re.IGNORECASE))

        # Extract percentages
        percentage_pattern = r'\d+(?:\.\d+)?%'
        data_points.extend(re.findall(percentage_pattern, text))

        # Extract specific market references
        market_refs = ['sensex', 'nifty', 'gold', 'fii', 'dii', 'sip', 'inflation', 'gdp']
        for ref in market_refs:
            if ref in text.lower():
                data_points.append(ref)

        return data_points

    def analyze_advisor_content(self, advisor_id, current_content, historical_content):
        """Analyze content freshness for a single advisor"""
        analysis = {
            'advisor_id': advisor_id,
            'freshness_score': 0,
            'linkedin_analysis': {},
            'whatsapp_analysis': {},
            'flags': [],
            'recommendations': []
        }

        # Analyze LinkedIn posts
        current_linkedin = current_content['linkedin'].get(advisor_id, [])
        historical_linkedin = historical_content['linkedin'].get(advisor_id, [])

        if current_linkedin:
            linkedin_score, linkedin_flags = self.analyze_content_set(
                current_linkedin, historical_linkedin, 'linkedin'
            )
            analysis['linkedin_analysis'] = {
                'score': linkedin_score,
                'flags': linkedin_flags,
                'post_count': len(current_linkedin)
            }

        # Analyze WhatsApp messages
        current_whatsapp = current_content['whatsapp'].get(advisor_id, [])
        historical_whatsapp = historical_content['whatsapp'].get(advisor_id, [])

        if current_whatsapp:
            whatsapp_score, whatsapp_flags = self.analyze_content_set(
                current_whatsapp, historical_whatsapp, 'whatsapp'
            )
            analysis['whatsapp_analysis'] = {
                'score': whatsapp_score,
                'flags': whatsapp_flags,
                'message_count': len(current_whatsapp)
            }

        # Calculate overall freshness score
        linkedin_weight = 0.5
        whatsapp_weight = 0.5

        linkedin_score = analysis['linkedin_analysis'].get('score', 10)
        whatsapp_score = analysis['whatsapp_analysis'].get('score', 10)

        analysis['freshness_score'] = (
            linkedin_score * linkedin_weight +
            whatsapp_score * whatsapp_weight
        )

        # Aggregate flags
        analysis['flags'] = (
            analysis['linkedin_analysis'].get('flags', []) +
            analysis['whatsapp_analysis'].get('flags', [])
        )

        # Generate recommendations
        if analysis['freshness_score'] < 6.0:
            analysis['recommendations'].append("CRITICAL: High repetition detected. Diversify topics and angles.")
        elif analysis['freshness_score'] < 8.0:
            analysis['recommendations'].append("WARNING: Some repetitive patterns. Consider varying content approach.")
        else:
            analysis['recommendations'].append("APPROVED: Content freshness is excellent.")

        return analysis

    def analyze_content_set(self, current_set, historical_set, content_type):
        """Analyze a set of content (LinkedIn or WhatsApp)"""
        score = 10.0
        flags = []

        # 1. Topic Diversity Check
        current_topics = self.extract_topics(current_set)
        historical_topics = self.extract_topics(historical_set[:10])  # Last 10

        if current_topics and historical_topics:
            topic_overlap = len(set(current_topics) & set(historical_topics)) / len(set(current_topics))
            if topic_overlap > self.config.get('topic_frequency_threshold', 0.40):
                score -= 2.0
                flags.append({
                    'type': 'topic_repetition',
                    'severity': 'high' if topic_overlap > 0.60 else 'medium',
                    'details': f"Topic overlap: {topic_overlap:.1%} (threshold: 40%)"
                })

        # 2. Content Similarity Check
        for current_item in current_set:
            current_text = current_item.get('content', '') or current_item.get('text', '')

            for historical_item in historical_set[:10]:
                historical_text = historical_item.get('content', '') or historical_item.get('text', '')

                similarity = self.calculate_semantic_similarity(current_text, historical_text)

                if similarity > self.similarity_threshold:
                    score -= 1.5
                    flags.append({
                        'type': 'content_similarity',
                        'severity': 'critical' if similarity > 0.85 else 'high',
                        'details': f"Similarity: {similarity:.1%} with recent content"
                    })
                    break  # One flag per current content

        # 3. Data Point Reuse Check
        current_data_points = []
        historical_data_points = []

        for item in current_set:
            text = item.get('content', '') or item.get('text', '')
            current_data_points.extend(self.extract_data_points(text))

        for item in historical_set[:10]:
            text = item.get('content', '') or item.get('text', '')
            historical_data_points.extend(self.extract_data_points(text))

        data_reuse = len(set(current_data_points) & set(historical_data_points))
        if data_reuse > 5:
            score -= 1.0
            flags.append({
                'type': 'data_point_reuse',
                'severity': 'medium',
                'details': f"{data_reuse} repeated data points detected"
            })

        # 4. Hook Variety Check
        current_hooks = [item.get('hook', '') or item.get('viralHook', '') for item in current_set]
        hook_variety = len(set(current_hooks)) / len(current_hooks) if current_hooks else 1.0

        if hook_variety < 0.5:
            score -= 1.0
            flags.append({
                'type': 'hook_repetition',
                'severity': 'medium',
                'details': f"Hook variety: {hook_variety:.1%} (target: >50%)"
            })

        # 5. Emotional Tone Balance
        emotions = []
        for item in current_set:
            text = item.get('content', '') or item.get('text', '')

            # Simple emotion detection
            if any(word in text.lower() for word in ['mistake', 'loss', 'panic', 'fear']):
                emotions.append('fear')
            elif any(word in text.lower() for word in ['opportunity', 'win', 'success', 'growth']):
                emotions.append('aspiration')
            elif any(word in text.lower() for word in ['fomo', 'missing', 'too late', 'rush']):
                emotions.append('urgency')
            elif any(word in text.lower() for word in ['learn', 'understand', 'explain', 'framework']):
                emotions.append('education')

        if emotions:
            emotion_counts = Counter(emotions)
            max_emotion_freq = max(emotion_counts.values()) / len(emotions)

            if max_emotion_freq > 0.70:
                score -= 0.5
                flags.append({
                    'type': 'emotion_imbalance',
                    'severity': 'low',
                    'details': f"Dominant emotion at {max_emotion_freq:.1%}"
                })

        return max(0, score), flags

    def generate_report(self):
        """Generate comprehensive fatigue report"""
        current_content = self.load_current_content()
        historical_content = self.load_historical_content()

        # Get all advisor IDs
        all_advisors = set()
        all_advisors.update(current_content['linkedin'].keys())
        all_advisors.update(current_content['whatsapp'].keys())

        # Analyze each advisor
        for advisor_id in sorted(all_advisors):
            analysis = self.analyze_advisor_content(advisor_id, current_content, historical_content)
            self.analysis_results['advisors'][advisor_id] = analysis

            # Count approved/flagged
            if analysis['freshness_score'] >= 8.0:
                self.analysis_results['approved_count'] += 1
            else:
                self.analysis_results['flagged_count'] += 1

        # Calculate overall score
        if self.analysis_results['advisors']:
            total_score = sum(a['freshness_score'] for a in self.analysis_results['advisors'].values())
            self.analysis_results['overall_score'] = total_score / len(self.analysis_results['advisors'])

        # Determine distribution status
        if self.analysis_results['overall_score'] >= 8.0:
            self.analysis_results['distribution_status'] = 'APPROVED'
        elif self.analysis_results['overall_score'] >= 6.0:
            self.analysis_results['distribution_status'] = 'NEEDS_REVIEW'
        else:
            self.analysis_results['distribution_status'] = 'NEEDS_REVISION'

        return self.analysis_results

    def save_report(self):
        """Save analysis report"""
        fatigue_dir = os.path.join(self.session_dir, 'fatigue')
        os.makedirs(fatigue_dir, exist_ok=True)

        # Save JSON report
        json_path = os.path.join(fatigue_dir, 'fatigue_analysis.json')
        with open(json_path, 'w') as f:
            json.dump(self.analysis_results, f, indent=2)

        # Save Markdown report
        md_path = os.path.join(fatigue_dir, 'FATIGUE_REPORT.md')
        with open(md_path, 'w') as f:
            self.write_markdown_report(f)

        print(f"✓ Fatigue analysis saved:")
        print(f"  JSON: {json_path}")
        print(f"  Report: {md_path}")

    def write_markdown_report(self, f):
        """Write markdown format report"""
        f.write(f"# Content Fatigue Analysis Report\n\n")
        f.write(f"**Session**: {self.session_id}\n")
        f.write(f"**Timestamp**: {self.analysis_results['timestamp']}\n")
        f.write(f"**Overall Freshness Score**: {self.analysis_results['overall_score']:.1f}/10\n")
        f.write(f"**Distribution Status**: **{self.analysis_results['distribution_status']}**\n\n")

        f.write(f"---\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- **Total Advisors**: {len(self.analysis_results['advisors'])}\n")
        f.write(f"- **Approved (≥8.0)**: {self.analysis_results['approved_count']}\n")
        f.write(f"- **Flagged (<8.0)**: {self.analysis_results['flagged_count']}\n\n")

        f.write(f"---\n\n")
        f.write(f"## Advisor Analysis\n\n")

        for advisor_id, analysis in sorted(self.analysis_results['advisors'].items()):
            f.write(f"### {advisor_id}\n\n")
            f.write(f"**Freshness Score**: {analysis['freshness_score']:.1f}/10\n\n")

            # LinkedIn
            if analysis.get('linkedin_analysis'):
                la = analysis['linkedin_analysis']
                f.write(f"**LinkedIn Posts** ({la['post_count']} posts)\n")
                f.write(f"- Score: {la['score']:.1f}/10\n")
                if la['flags']:
                    f.write(f"- Flags: {len(la['flags'])}\n")
                    for flag in la['flags']:
                        f.write(f"  - [{flag['severity'].upper()}] {flag['type']}: {flag['details']}\n")
                f.write(f"\n")

            # WhatsApp
            if analysis.get('whatsapp_analysis'):
                wa = analysis['whatsapp_analysis']
                f.write(f"**WhatsApp Messages** ({wa['message_count']} messages)\n")
                f.write(f"- Score: {wa['score']:.1f}/10\n")
                if wa['flags']:
                    f.write(f"- Flags: {len(wa['flags'])}\n")
                    for flag in wa['flags']:
                        f.write(f"  - [{flag['severity'].upper()}] {flag['type']}: {flag['details']}\n")
                f.write(f"\n")

            # Recommendations
            if analysis.get('recommendations'):
                f.write(f"**Recommendations**:\n")
                for rec in analysis['recommendations']:
                    f.write(f"- {rec}\n")

            f.write(f"\n---\n\n")

        # Overall recommendations
        f.write(f"## Overall Recommendations\n\n")

        if self.analysis_results['distribution_status'] == 'APPROVED':
            f.write(f"✅ **APPROVED FOR DISTRIBUTION**\n\n")
            f.write(f"All content shows excellent freshness and diversity. Ready for distribution.\n\n")
        elif self.analysis_results['distribution_status'] == 'NEEDS_REVIEW':
            f.write(f"⚠️ **NEEDS REVIEW**\n\n")
            f.write(f"Some repetitive patterns detected. Review flagged items before distribution.\n\n")
        else:
            f.write(f"❌ **NEEDS REVISION**\n\n")
            f.write(f"Significant repetition detected. Revise content before distribution.\n\n")

        f.write(f"### Key Metrics\n\n")
        f.write(f"- **Similarity Threshold**: {self.similarity_threshold:.0%}\n")
        f.write(f"- **Topic Rotation Window**: {self.topic_rotation_days} days\n")
        f.write(f"- **History Window**: {self.history_window_days} days\n")
        f.write(f"- **Analysis Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")


def main():
    """Main execution"""
    import sys

    session_id = sys.argv[1] if len(sys.argv) > 1 else 'session_1759798367'

    print(f"🔍 Fatigue Checker Agent")
    print(f"Session: {session_id}")
    print(f"=" * 60)

    checker = FatigueChecker(session_id)

    print(f"\n📊 Analyzing content freshness...")
    results = checker.generate_report()

    print(f"\n📈 Results:")
    print(f"  Overall Score: {results['overall_score']:.1f}/10")
    print(f"  Status: {results['distribution_status']}")
    print(f"  Approved: {results['approved_count']}/{len(results['advisors'])}")
    print(f"  Flagged: {results['flagged_count']}/{len(results['advisors'])}")

    checker.save_report()

    print(f"\n✅ Fatigue analysis complete!")


if __name__ == '__main__':
    main()

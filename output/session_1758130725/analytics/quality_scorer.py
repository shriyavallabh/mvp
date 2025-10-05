#!/usr/bin/env python3
"""
Quality Scorer Agent - Multi-dimensional Content Quality Assessment
Author: Quality Excellence Team
Date: 2025-01-16
Version: 1.0
"""

import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
import statistics

class ContentQualityScorer:
    """
    Multi-dimensional quality scoring engine for FinAdvise content.
    Evaluates content across 6 key dimensions with weighted scoring.
    """

    def __init__(self):
        """Initialize quality scoring framework with dimension weights"""
        self.dimension_weights = {
            'relevance': 0.20,      # Market timing and audience fit
            'clarity': 0.20,        # Readability and value proposition
            'engagement': 0.20,     # Hook strength and emotional appeal
            'credibility': 0.15,    # Data accuracy and professional tone
            'personalization': 0.15, # Advisor name integration and segment fit
            'technical': 0.10       # Grammar, formatting, visual quality
        }

        self.segment_standards = {
            'Premium': {
                'min_data_points': 5,
                'sophistication_level': 0.9,
                'personalization_frequency': 3,
                'ideal_length': (1500, 2000)
            },
            'Gold': {
                'min_data_points': 3,
                'sophistication_level': 0.7,
                'personalization_frequency': 2,
                'ideal_length': (800, 1200)
            },
            'Silver': {
                'min_data_points': 1,
                'sophistication_level': 0.5,
                'personalization_frequency': 1,
                'ideal_length': (300, 600)
            }
        }

        self.auto_approval_threshold = 0.80
        self.manual_review_range = (0.60, 0.79)
        self.rejection_threshold = 0.60

    def calculate_flesch_reading_ease(self, text: str) -> float:
        """Calculate Flesch Reading Ease score for readability"""
        sentences = text.count('.') + text.count('!') + text.count('?')
        words = len(text.split())
        syllables = self._count_syllables(text)

        if sentences == 0 or words == 0:
            return 0.0

        avg_sentence_length = words / sentences
        avg_syllables_per_word = syllables / words

        flesch_score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word

        # Normalize to 0-1 scale
        if flesch_score >= 60:  # Easy to read
            return 1.0
        elif flesch_score >= 50:  # Moderate
            return 0.8
        elif flesch_score >= 40:  # Difficult
            return 0.6
        else:  # Very difficult
            return 0.4

    def _count_syllables(self, text: str) -> int:
        """Count syllables in text for readability calculation"""
        vowels = 'aeiouyAEIOUY'
        syllable_count = 0
        words = text.split()

        for word in words:
            word = word.strip('.,!?;:')
            vowel_count = 0
            prev_was_vowel = False

            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_was_vowel:
                    vowel_count += 1
                prev_was_vowel = is_vowel

            if word.endswith('e'):
                vowel_count -= 1
            if vowel_count == 0:
                vowel_count = 1

            syllable_count += vowel_count

        return syllable_count

    def score_relevance(self, content: Dict, segment: str) -> Dict[str, float]:
        """Score content relevance based on market timing and audience fit"""
        scores = {}

        # Check for market timing keywords
        market_keywords = ['today', 'fed', 'rate cut', 'sensex', 'nifty', 'sector',
                          'iphone', 'banking', 'it sector', 'surge', 'rally']
        text = json.dumps(content).lower()
        keyword_matches = sum(1 for kw in market_keywords if kw in text)
        scores['market_timing'] = min(keyword_matches / 5, 1.0)

        # Audience fit based on segment
        if segment == 'Premium':
            sophisticated_terms = ['portfolio', 'allocation', 'hedge', 'arbitrage',
                                  'derivative', 'hni', 'estate', 'tax optimization']
            sophistication_score = sum(1 for term in sophisticated_terms if term in text)
            scores['audience_fit'] = min(sophistication_score / 4, 1.0)
        elif segment == 'Gold':
            educational_terms = ['sip', 'mutual fund', 'tax saving', 'elss',
                               'simple', 'easy', 'understand', 'learn']
            education_score = sum(1 for term in educational_terms if term in text)
            scores['audience_fit'] = min(education_score / 4, 1.0)
        else:  # Silver
            simple_terms = ['basic', 'simple', 'easy', 'start', 'beginner',
                           'app', 'digital', 'quick']
            simplicity_score = sum(1 for term in simple_terms if term in text)
            scores['audience_fit'] = min(simplicity_score / 3, 1.0)

        # Trending topic alignment
        trending_topics = ['iphone 17', 'fed rate', 'tech rally', 'tax deadline',
                          'september', 'q4', 'estate planning']
        trending_score = sum(1 for topic in trending_topics if topic in text)
        scores['trending_alignment'] = min(trending_score / 3, 1.0)

        # Seasonal relevance
        seasonal_terms = ['september', 'tax', 'q4', 'year-end', 'festive', 'diwali']
        seasonal_score = sum(1 for term in seasonal_terms if term in text)
        scores['seasonal_relevance'] = min(seasonal_score / 2, 1.0)

        return scores

    def score_clarity(self, content: Dict) -> Dict[str, float]:
        """Score content clarity including readability and structure"""
        scores = {}

        # Get text content
        if 'content' in content:
            text = content['content']
        elif 'text' in content:
            text = content['text']
        else:
            text = json.dumps(content)

        # Readability score
        scores['readability'] = self.calculate_flesch_reading_ease(text)

        # Value proposition clarity
        value_indicators = ['benefit', 'save', 'earn', 'grow', 'profit',
                           'return', 'gain', 'achieve', 'secure']
        value_score = sum(1 for ind in value_indicators if ind in text.lower())
        scores['value_clarity'] = min(value_score / 3, 1.0)

        # Logical flow - check for numbered points or bullets
        has_structure = bool(re.search(r'[1-9]\.|•|✓|→|\n\n', text))
        scores['logical_flow'] = 1.0 if has_structure else 0.6

        # Jargon density (lower is better)
        complex_terms = ['derivative', 'arbitrage', 'hedging', 'volatility',
                        'correlation', 'beta', 'alpha', 'sharpe ratio']
        jargon_count = sum(1 for term in complex_terms if term in text.lower())
        word_count = len(text.split())
        jargon_ratio = jargon_count / max(word_count, 1) * 100
        scores['jargon_score'] = max(1.0 - (jargon_ratio / 2), 0.3)

        return scores

    def score_engagement(self, content: Dict) -> Dict[str, float]:
        """Score engagement potential including hooks and CTAs"""
        scores = {}

        if 'content' in content:
            text = content['content']
        elif 'text' in content:
            text = content['text']
        else:
            text = json.dumps(content)

        # Hook strength (first 150 characters)
        hook_text = text[:150].lower()
        hook_elements = ['big news', 'alert', 'exclusive', 'critical',
                        'urgent', '!', '?', 'you', 'your']
        hook_score = sum(1 for elem in hook_elements if elem in hook_text)
        scores['hook_power'] = min(hook_score / 3, 1.0)

        # Emotional appeal
        emotion_words = ['exciting', 'powerful', 'transform', 'secure', 'protect',
                        'grow', 'achieve', 'success', 'opportunity', 'exclusive']
        emotion_score = sum(1 for word in emotion_words if word in text.lower())
        scores['emotional_quotient'] = min(emotion_score / 4, 1.0)

        # CTA effectiveness
        cta_phrases = ['reply', 'dm', 'connect', 'schedule', 'book',
                      'contact', 'call', 'whatsapp', 'click']
        has_cta = any(phrase in text.lower() for phrase in cta_phrases)
        scores['cta_effectiveness'] = 1.0 if has_cta else 0.3

        # Viral potential
        viral_factors = {
            'numbers': bool(re.search(r'\d+[%₹$]', text)),
            'emoji': bool(re.search(r'[😀-🙏💰-💸🎯🔥⚡️📈📊]', text)),
            'question': '?' in text,
            'urgency': any(word in text.lower() for word in ['today', 'now', 'last', 'deadline']),
            'social_proof': any(word in text.lower() for word in ['client', 'success', 'helped', 'achieved'])
        }
        viral_score = sum(viral_factors.values()) / len(viral_factors)
        scores['viral_potential'] = viral_score

        return scores

    def score_credibility(self, content: Dict) -> Dict[str, float]:
        """Score content credibility including data accuracy and tone"""
        scores = {}

        if 'content' in content:
            text = content['content']
        elif 'text' in content:
            text = content['text']
        else:
            text = json.dumps(content)

        # Data verification
        has_numbers = bool(re.search(r'\d+\.?\d*[%₹$]|\d+[kKlLcC]r', text))
        has_specific_data = bool(re.search(r'sensex.*\d+|nifty.*\d+|\+\d+\.?\d*%', text.lower()))
        scores['data_verification'] = 1.0 if (has_numbers and has_specific_data) else 0.5 if has_numbers else 0.3

        # Source citations
        has_credentials = bool(re.search(r'arn|sebi|cfp|registered', text.lower()))
        scores['source_quality'] = 1.0 if has_credentials else 0.6

        # Professional tone
        unprofessional = ['guarantee', 'assured', 'risk-free', 'definitely',
                         'always profit', 'never lose']
        has_unprofessional = any(term in text.lower() for term in unprofessional)
        scores['tone_professionalism'] = 0.3 if has_unprofessional else 1.0

        # Expertise demonstration
        expertise_indicators = ['experience', 'helped', 'clients', 'track record',
                              'expertise', 'years', 'portfolio', 'aum']
        expertise_score = sum(1 for ind in expertise_indicators if ind in text.lower())
        scores['expertise_display'] = min(expertise_score / 3, 1.0)

        return scores

    def score_personalization(self, content: Dict, advisor_data: Dict) -> Dict[str, float]:
        """Score content personalization for advisor and segment"""
        scores = {}

        if 'content' in content:
            text = content['content']
        elif 'text' in content:
            text = content['text']
        else:
            text = json.dumps(content)

        # Name integration
        advisor_name = advisor_data.get('name', '').split()[0] if 'name' in advisor_data else ''
        name_count = text.lower().count(advisor_name.lower()) if advisor_name else 0
        expected_count = self.segment_standards[advisor_data['segment']]['personalization_frequency']
        scores['name_integration'] = min(name_count / expected_count, 1.0) if expected_count > 0 else 0.5

        # Segment customization
        segment = advisor_data.get('segment', 'Silver')
        if segment == 'Premium':
            segment_terms = ['hni', 'portfolio', 'estate', 'wealth', 'exclusive']
        elif segment == 'Gold':
            segment_terms = ['sip', 'mutual fund', 'tax', 'planning', 'education']
        else:
            segment_terms = ['simple', 'easy', 'basic', 'start', 'beginner']

        segment_score = sum(1 for term in segment_terms if term in text.lower())
        scores['segment_alignment'] = min(segment_score / 3, 1.0)

        # Brand consistency
        brand_name = advisor_data.get('brand_name', '')
        has_brand = brand_name.lower() in text.lower() if brand_name else False
        scores['brand_consistency'] = 1.0 if has_brand else 0.5

        # Local relevance
        local_terms = ['mumbai', 'delhi', 'bangalore', 'india', 'inr', '₹', 'indian']
        local_score = sum(1 for term in local_terms if term in text.lower())
        scores['local_relevance'] = min(local_score / 2, 1.0)

        return scores

    def score_technical(self, content: Dict, content_type: str) -> Dict[str, float]:
        """Score technical quality including grammar and formatting"""
        scores = {}

        if 'content' in content:
            text = content['content']
            char_count = content.get('characterCount', len(text))
        elif 'text' in content:
            text = content['text']
            char_count = content.get('character_count', len(text))
        else:
            text = json.dumps(content)
            char_count = len(text)

        # Grammar check (simplified - checking for basic issues)
        grammar_issues = [
            r'\s{2,}',  # Multiple spaces
            r'[.!?]{2,}',  # Multiple punctuation
            r'\n{3,}',  # Too many line breaks
            r'^[a-z]',  # Sentence starting with lowercase
        ]
        issue_count = sum(1 for pattern in grammar_issues if re.search(pattern, text))
        scores['grammar_check'] = max(1.0 - (issue_count * 0.2), 0.4)

        # Format consistency
        has_emoji = bool(re.search(r'[😀-🙏💰-💸🎯🔥⚡️📈📊]', text))
        has_structure = bool(re.search(r'[1-9]\.|•|✓|→', text))
        scores['format_consistency'] = 1.0 if (has_emoji and has_structure) else 0.7

        # Length optimization
        if content_type == 'linkedin':
            ideal_min, ideal_max = 1200, 2000
        elif content_type == 'whatsapp':
            ideal_min, ideal_max = 200, 400
        else:
            ideal_min, ideal_max = 300, 1500

        if ideal_min <= char_count <= ideal_max:
            scores['length_optimization'] = 1.0
        elif char_count < ideal_min:
            scores['length_optimization'] = char_count / ideal_min
        else:
            scores['length_optimization'] = max(1.0 - ((char_count - ideal_max) / ideal_max), 0.5)

        # Visual quality (for status images)
        if content_type == 'status' or 'image' in content_type:
            scores['visual_quality'] = 0.9  # Assuming good quality for generated images
        else:
            scores['visual_quality'] = 1.0  # N/A for text content

        return scores

    def calculate_total_score(self, dimension_scores: Dict[str, Dict[str, float]]) -> Tuple[float, Dict]:
        """Calculate weighted total score and generate report"""
        total_score = 0
        dimension_averages = {}

        for dimension, metrics in dimension_scores.items():
            if metrics:
                avg_score = statistics.mean(metrics.values())
                dimension_averages[dimension] = avg_score
                weight = self.dimension_weights.get(dimension, 0)
                total_score += avg_score * weight

        return total_score, dimension_averages

    def identify_strengths(self, dimension_averages: Dict[str, float]) -> List[str]:
        """Identify top performing dimensions"""
        strengths = []
        sorted_dims = sorted(dimension_averages.items(), key=lambda x: x[1], reverse=True)

        for dim, score in sorted_dims[:3]:
            if score >= 0.8:
                if dim == 'relevance':
                    strengths.append("Excellent market timing and audience alignment")
                elif dim == 'clarity':
                    strengths.append("Clear value proposition and readable content")
                elif dim == 'engagement':
                    strengths.append("Strong hooks and viral potential")
                elif dim == 'credibility':
                    strengths.append("Data-backed insights with professional tone")
                elif dim == 'personalization':
                    strengths.append("Well-personalized for advisor and segment")
                elif dim == 'technical':
                    strengths.append("Professional formatting and optimal length")

        return strengths

    def suggest_improvements(self, dimension_scores: Dict, dimension_averages: Dict) -> List[Dict]:
        """Generate specific improvement suggestions"""
        improvements = []

        for dim, avg_score in dimension_averages.items():
            if avg_score < 0.7:
                if dim == 'clarity':
                    improvements.append({
                        'issue': 'Content clarity needs improvement',
                        'fix': 'Simplify language, break long sentences, add bullet points',
                        'impact': 'high',
                        'priority': 1
                    })
                elif dim == 'engagement':
                    improvements.append({
                        'issue': 'Low engagement potential',
                        'fix': 'Strengthen hook, add personal story, clearer CTA',
                        'impact': 'high',
                        'priority': 1
                    })
                elif dim == 'personalization':
                    improvements.append({
                        'issue': 'Insufficient personalization',
                        'fix': 'Add advisor name 2-3 times, mention segment specifically',
                        'impact': 'medium',
                        'priority': 2
                    })
                elif dim == 'credibility':
                    improvements.append({
                        'issue': 'Credibility could be stronger',
                        'fix': 'Add more data points, include credentials prominently',
                        'impact': 'medium',
                        'priority': 2
                    })

        # Sort by priority
        improvements.sort(key=lambda x: x['priority'])
        return improvements[:3]  # Top 3 improvements

    def get_distribution_recommendation(self, total_score: float, segment: str) -> str:
        """Generate distribution recommendation based on score"""
        if total_score >= self.auto_approval_threshold:
            return f"✅ APPROVE - High quality content ready for immediate distribution to {segment} segment"
        elif self.manual_review_range[0] <= total_score <= self.manual_review_range[1]:
            return f"⚠️ MANUAL REVIEW - Content meets minimum standards but could benefit from improvements"
        else:
            return f"❌ REGENERATE - Content quality below threshold, requires significant improvements"

    def score_content(self, content: Dict, advisor_data: Dict, content_type: str) -> Dict:
        """Main scoring function - evaluates content across all dimensions"""
        dimension_scores = {}

        # Score each dimension
        dimension_scores['relevance'] = self.score_relevance(content, advisor_data['segment'])
        dimension_scores['clarity'] = self.score_clarity(content)
        dimension_scores['engagement'] = self.score_engagement(content)
        dimension_scores['credibility'] = self.score_credibility(content)
        dimension_scores['personalization'] = self.score_personalization(content, advisor_data)
        dimension_scores['technical'] = self.score_technical(content, content_type)

        # Calculate total score
        total_score, dimension_averages = self.calculate_total_score(dimension_scores)

        # Generate insights
        strengths = self.identify_strengths(dimension_averages)
        improvements = self.suggest_improvements(dimension_scores, dimension_averages)

        # Determine grade
        if total_score >= 0.9:
            grade = 'A+'
        elif total_score >= 0.8:
            grade = 'A'
        elif total_score >= 0.7:
            grade = 'B'
        elif total_score >= 0.6:
            grade = 'C'
        else:
            grade = 'D'

        # Build quality report
        quality_report = {
            'content_id': content.get('postId', content.get('advisor_id', 'unknown')),
            'content_type': content_type,
            'segment': advisor_data['segment'],
            'timestamp': datetime.now().isoformat(),
            'overall_score': round(total_score, 2),
            'grade': grade,
            'auto_approval_eligible': total_score >= self.auto_approval_threshold,
            'breakdown': {k: round(v, 2) for k, v in dimension_averages.items()},
            'detailed_scores': dimension_scores,
            'strengths': strengths,
            'improvements': improvements,
            'predictions': {
                'engagement_rate': round(4.2 * total_score, 1),  # Estimated engagement %
                'viral_probability': round(dimension_scores['engagement'].get('viral_potential', 0.5), 2),
                'conversion_estimate': round(0.08 * total_score, 3)
            },
            'recommendation': self.get_distribution_recommendation(total_score, advisor_data['segment'])
        }

        return quality_report


def main():
    """Main function to score all Phase 4 branded content"""
    scorer = ContentQualityScorer()
    session_dir = "/Users/shriyavallabh/Desktop/mvp/output/session_1758130725"
    analytics_dir = f"{session_dir}/analytics"

    # Ensure analytics directory exists
    os.makedirs(analytics_dir, exist_ok=True)

    # Track all scores
    all_scores = []
    segment_scores = {'Premium': [], 'Gold': [], 'Silver': []}
    content_type_scores = {'linkedin': [], 'whatsapp': [], 'status': []}

    print("🎯 Starting Quality Scoring for Phase 4 Branded Content")
    print("=" * 60)

    # Score LinkedIn content
    linkedin_dir = f"{session_dir}/branded/linkedin"
    if os.path.exists(linkedin_dir):
        for file in os.listdir(linkedin_dir):
            if file.endswith('.json'):
                file_path = os.path.join(linkedin_dir, file)
                with open(file_path, 'r') as f:
                    data = json.load(f)

                advisor_data = {
                    'advisor_id': data['advisor_id'],
                    'name': 'Shruti Petkar' if 'ADV_001' in data['advisor_id'] else
                           'Rajesh Kumar' if 'ADV_002' in data['advisor_id'] else
                           'Priya Sharma',
                    'segment': data['segment'],
                    'brand_name': data['brand_name']
                }

                # Score each post
                for post in data.get('posts', []):
                    score_report = scorer.score_content(post, advisor_data, 'linkedin')
                    all_scores.append(score_report)
                    segment_scores[advisor_data['segment']].append(score_report['overall_score'])
                    content_type_scores['linkedin'].append(score_report['overall_score'])

    # Score WhatsApp content
    whatsapp_dir = f"{session_dir}/branded/whatsapp"
    if os.path.exists(whatsapp_dir):
        for file in os.listdir(whatsapp_dir):
            if file.endswith('.json'):
                file_path = os.path.join(whatsapp_dir, file)
                with open(file_path, 'r') as f:
                    data = json.load(f)

                advisor_data = {
                    'advisor_id': data['advisor_id'],
                    'name': 'Shruti' if 'ADV_001' in data['advisor_id'] else
                           'Rajesh' if 'ADV_002' in data['advisor_id'] else
                           'Priya',
                    'segment': data['segment'],
                    'brand_name': data['brand_name']
                }

                # Score each message
                for msg in data.get('messages', []):
                    score_report = scorer.score_content(msg, advisor_data, 'whatsapp')
                    all_scores.append(score_report)
                    segment_scores[advisor_data['segment']].append(score_report['overall_score'])
                    content_type_scores['whatsapp'].append(score_report['overall_score'])

    # Score status images (metadata only)
    status_dir = f"{session_dir}/branded/status-images"
    if os.path.exists(status_dir):
        for file in os.listdir(status_dir):
            if file.endswith('.json'):
                file_path = os.path.join(status_dir, file)
                with open(file_path, 'r') as f:
                    data = json.load(f)

                # Extract advisor info from filename
                advisor_id = file.split('_')[1]
                segment = 'Premium' if 'ADV_001' in advisor_id else \
                         'Gold' if 'ADV_002' in advisor_id else 'Silver'

                advisor_data = {
                    'advisor_id': advisor_id,
                    'segment': segment,
                    'brand_name': data.get('brand_config', {}).get('brand_name', '')
                }

                # Simple scoring for images based on branding metadata
                image_score = {
                    'overall_score': 0.85 if data.get('branding_applied', {}).get('logo_placement') else 0.7,
                    'content_type': 'status_image',
                    'segment': segment,
                    'auto_approval_eligible': True
                }

                segment_scores[segment].append(image_score['overall_score'])
                content_type_scores['status'].append(image_score['overall_score'])

    # Calculate aggregate statistics
    aggregate_stats = {
        'total_content_evaluated': len(all_scores),
        'average_quality_score': round(statistics.mean([s['overall_score'] for s in all_scores]), 2),
        'auto_approved': sum(1 for s in all_scores if s['auto_approval_eligible']),
        'manual_review': sum(1 for s in all_scores if 0.6 <= s['overall_score'] < 0.8),
        'rejected': sum(1 for s in all_scores if s['overall_score'] < 0.6),
        'segment_averages': {
            seg: round(statistics.mean(scores), 2) if scores else 0
            for seg, scores in segment_scores.items()
        },
        'content_type_averages': {
            ct: round(statistics.mean(scores), 2) if scores else 0
            for ct, scores in content_type_scores.items()
        }
    }

    # Generate final quality report
    final_report = {
        'quality_assessment': {
            'timestamp': datetime.now().isoformat(),
            'session_id': 'session_1758130725',
            'aggregate_statistics': aggregate_stats,
            'top_performers': sorted(all_scores, key=lambda x: x['overall_score'], reverse=True)[:5],
            'improvement_needed': sorted(all_scores, key=lambda x: x['overall_score'])[:5],
            'distribution_summary': {
                'ready_for_distribution': aggregate_stats['auto_approved'],
                'needs_review': aggregate_stats['manual_review'],
                'needs_regeneration': aggregate_stats['rejected']
            },
            'quality_insights': {
                'best_segment': max(segment_scores.items(), key=lambda x: statistics.mean(x[1]) if x[1] else 0)[0],
                'best_content_type': max(content_type_scores.items(), key=lambda x: statistics.mean(x[1]) if x[1] else 0)[0],
                'overall_readiness': 'HIGH' if aggregate_stats['average_quality_score'] >= 0.8 else
                                    'MEDIUM' if aggregate_stats['average_quality_score'] >= 0.6 else 'LOW'
            }
        },
        'detailed_scores': all_scores
    }

    # Save reports
    with open(f"{analytics_dir}/quality_assessment_report.json", 'w') as f:
        json.dump(final_report, f, indent=2)

    with open(f"{analytics_dir}/quality_summary.json", 'w') as f:
        json.dump(aggregate_stats, f, indent=2)

    # Print summary
    print(f"\n📊 Quality Assessment Complete!")
    print(f"Total Content Evaluated: {aggregate_stats['total_content_evaluated']}")
    print(f"Average Quality Score: {aggregate_stats['average_quality_score']}")
    print(f"Auto-Approved: {aggregate_stats['auto_approved']}")
    print(f"Manual Review: {aggregate_stats['manual_review']}")
    print(f"Rejected: {aggregate_stats['rejected']}")
    print(f"\n✅ Reports saved to {analytics_dir}")

    return final_report


if __name__ == "__main__":
    main()
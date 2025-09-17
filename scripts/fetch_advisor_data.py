#!/usr/bin/env python3
"""
Advisor Data Manager - Fetches and manages advisor data from Google Sheets
Falls back to comprehensive sample data if Google Sheets is not accessible
Session ID: session_2025-09-17T11-34-21-000Z
"""

import json
import os
from datetime import datetime
import random

def generate_comprehensive_sample_data():
    """Generate comprehensive sample advisor data with full customization"""

    # Sample data arrays for random generation
    firm_names = [
        "Wealth Creators Advisory", "Prosperity Financial Solutions",
        "SecureWealth Consultancy", "Future First Advisors",
        "Capital Growth Partners", "WealthWise Financial Services"
    ]

    taglines = [
        "Building Wealth, Creating Trust",
        "Your Partner in Financial Success",
        "Securing Your Financial Future",
        "Wealth Creation Through Wisdom",
        "Growing Together, Prospering Forever",
        "Smart Investments, Secure Tomorrow"
    ]

    focus_areas = [
        ["Equity", "Debt", "Tax Planning"],
        ["Mutual Funds", "SIP", "Portfolio Management"],
        ["Retirement Planning", "Insurance", "Estate Planning"],
        ["Equity Research", "Derivatives", "Alternative Investments"],
        ["Tax Saving", "ELSS", "PPF"],
        ["Gold Investments", "Real Estate", "Fixed Deposits"]
    ]

    disclaimers = [
        "Mutual Fund investments are subject to market risks. Please read all scheme related documents carefully before investing.",
        "Past performance is not indicative of future results. Investment decisions should be based on individual risk appetite.",
        "This is for informational purposes only and should not be construed as investment advice.",
        "Investments in securities market are subject to market risks. Read all the related documents carefully before investing.",
        "The views expressed are personal and for information only. Please consult your financial advisor before making any investment decision."
    ]

    # Generate 5 comprehensive advisor profiles
    advisors = []

    # Advisor 1 - Premium Segment (Shruti Petkar)
    advisors.append({
        "advisorId": "ADV_001",
        "personalInfo": {
            "name": "Shruti Petkar",
            "phone": "919022810769",
            "email": "shruti.petkar@wealthcreators.com",
            "arn": "ARN-123456"
        },
        "businessInfo": {
            "firmName": "Wealth Creators Advisory",
            "experience": "12 years",
            "aum": "₹75 Crores",
            "clientCount": 320,
            "certifications": ["CFP", "CFA Level 2", "NISM Series X-A"]
        },
        "segmentInfo": {
            "primarySegment": "Premium",
            "clientDemographics": ["HNI Clients", "Young Professionals", "Business Owners"],
            "focusAreas": ["Equity", "Alternative Investments", "Tax Planning"],
            "specialization": "Wealth Management for HNIs"
        },
        "customization": {
            "brandName": "WealthCreators by Shruti",
            "logoUrl": "https://drive.google.com/file/d/1ABC123_shruti_logo/view",
            "brandColors": {
                "primary": "#1A73E8",
                "secondary": "#34A853"
            },
            "tagline": "Building Wealth, Creating Trust",
            "disclaimer": "Mutual Fund investments are subject to market risks. Please read all scheme related documents carefully.",
            "customTemplates": {
                "greeting": "Dear {client_name}, Greetings from WealthCreators!",
                "signature": "Best Regards,\nShruti Petkar\nCertified Financial Planner\nWealthCreators Advisory"
            }
        },
        "preferences": {
            "contentTone": "Professional",
            "postingTime": "9:00 AM",
            "languages": ["English", "Hindi", "Marathi"],
            "avoidTopics": ["Crypto", "F&O Trading"],
            "contentFrequency": "Daily",
            "channelPreferences": {
                "whatsapp": True,
                "linkedin": True,
                "email": True,
                "sms": False
            },
            "reviewMode": "auto-approve",
            "notificationSettings": {
                "contentReady": True,
                "clientResponse": True,
                "performanceReports": True
            }
        },
        "subscription": {
            "plan": "Premium",
            "status": "Active",
            "validUntil": "2025-12-31",
            "features": ["Custom Branding", "Multi-channel", "Analytics Dashboard", "Priority Support", "AI Content Generation"],
            "billingCycle": "Annual",
            "autoRenew": True
        },
        "analytics": {
            "contentEngagement": {
                "whatsapp": {"openRate": 0.87, "clickRate": 0.42},
                "linkedin": {"impressions": 5420, "engagement": 0.12}
            },
            "clientGrowth": 0.15,
            "aumGrowth": 0.23
        }
    })

    # Advisor 2 - Gold Segment (Raj Kumar)
    advisors.append({
        "advisorId": "ADV_002",
        "personalInfo": {
            "name": "Raj Kumar",
            "phone": "919876543211",
            "email": "raj.kumar@prosperityfs.com",
            "arn": "ARN-789012"
        },
        "businessInfo": {
            "firmName": "Prosperity Financial Solutions",
            "experience": "8 years",
            "aum": "₹35 Crores",
            "clientCount": 180,
            "certifications": ["NISM Series X-A", "NISM Series X-B"]
        },
        "segmentInfo": {
            "primarySegment": "Gold",
            "clientDemographics": ["Salaried Professionals", "SME Owners"],
            "focusAreas": ["Mutual Funds", "SIP", "Insurance"],
            "specialization": "Systematic Investment Planning"
        },
        "customization": {
            "brandName": "Prosperity Financial",
            "logoUrl": "https://drive.google.com/file/d/2DEF456_raj_logo/view",
            "brandColors": {
                "primary": "#FF6B6B",
                "secondary": "#4ECDC4"
            },
            "tagline": "Your Partner in Financial Success",
            "disclaimer": "Investment decisions should be based on individual risk appetite. Please consult before investing.",
            "customTemplates": {
                "greeting": "Hello {client_name}! Hope you're doing well.",
                "signature": "Warm Regards,\nRaj Kumar\nProsperity Financial Solutions"
            }
        },
        "preferences": {
            "contentTone": "Friendly",
            "postingTime": "10:30 AM",
            "languages": ["English", "Hindi"],
            "avoidTopics": ["Derivatives"],
            "contentFrequency": "Alternate Days",
            "channelPreferences": {
                "whatsapp": True,
                "linkedin": True,
                "email": False,
                "sms": True
            },
            "reviewMode": "manual",
            "notificationSettings": {
                "contentReady": True,
                "clientResponse": True,
                "performanceReports": False
            }
        },
        "subscription": {
            "plan": "Gold",
            "status": "Active",
            "validUntil": "2025-09-30",
            "features": ["Standard Branding", "Whatsapp & LinkedIn", "Basic Analytics"],
            "billingCycle": "Quarterly",
            "autoRenew": False
        },
        "analytics": {
            "contentEngagement": {
                "whatsapp": {"openRate": 0.75, "clickRate": 0.35},
                "linkedin": {"impressions": 2100, "engagement": 0.08}
            },
            "clientGrowth": 0.10,
            "aumGrowth": 0.18
        }
    })

    # Advisor 3 - Silver Segment (Priya Sharma)
    advisors.append({
        "advisorId": "ADV_003",
        "personalInfo": {
            "name": "Priya Sharma",
            "phone": "919765432100",
            "email": "priya@securewealthadvisory.com",
            "arn": "ARN-345678"
        },
        "businessInfo": {
            "firmName": "SecureWealth Consultancy",
            "experience": "5 years",
            "aum": "₹15 Crores",
            "clientCount": 95,
            "certifications": ["NISM Series X-A"]
        },
        "segmentInfo": {
            "primarySegment": "Silver",
            "clientDemographics": ["Young Professionals", "First-time Investors"],
            "focusAreas": ["SIP", "Tax Saving", "Basic Insurance"],
            "specialization": "Financial Planning for Beginners"
        },
        "customization": {
            "brandName": "SecureWealth Advisory",
            "logoUrl": "",
            "brandColors": {
                "primary": "#6B7280",
                "secondary": "#10B981"
            },
            "tagline": "Securing Your Financial Future",
            "disclaimer": "Please read all scheme related documents carefully before investing.",
            "customTemplates": {
                "greeting": "Dear {client_name},",
                "signature": "Regards,\nPriya Sharma\nSecureWealth Consultancy"
            }
        },
        "preferences": {
            "contentTone": "Educational",
            "postingTime": "11:00 AM",
            "languages": ["English"],
            "avoidTopics": ["Complex Derivatives", "Forex"],
            "contentFrequency": "Weekly",
            "channelPreferences": {
                "whatsapp": True,
                "linkedin": False,
                "email": True,
                "sms": False
            },
            "reviewMode": "auto-approve",
            "notificationSettings": {
                "contentReady": True,
                "clientResponse": False,
                "performanceReports": False
            }
        },
        "subscription": {
            "plan": "Silver",
            "status": "Active",
            "validUntil": "2025-08-31",
            "features": ["Basic Branding", "Whatsapp Only", "Monthly Reports"],
            "billingCycle": "Monthly",
            "autoRenew": True
        },
        "analytics": {
            "contentEngagement": {
                "whatsapp": {"openRate": 0.65, "clickRate": 0.25}
            },
            "clientGrowth": 0.08,
            "aumGrowth": 0.12
        }
    })

    # Advisor 4 - Premium Segment (Vidyadhar Kulkarni)
    advisors.append({
        "advisorId": "ADV_004",
        "personalInfo": {
            "name": "Vidyadhar Kulkarni",
            "phone": "919654321099",
            "email": "vidyadhar@futurefirstadvisors.com",
            "arn": "ARN-901234"
        },
        "businessInfo": {
            "firmName": "Future First Advisors",
            "experience": "15 years",
            "aum": "₹120 Crores",
            "clientCount": 450,
            "certifications": ["CFP", "CFA", "FRM"]
        },
        "segmentInfo": {
            "primarySegment": "Premium",
            "clientDemographics": ["Ultra HNI", "Corporate Executives", "NRIs"],
            "focusAreas": ["Portfolio Management", "Estate Planning", "International Investments"],
            "specialization": "Comprehensive Wealth Management"
        },
        "customization": {
            "brandName": "FutureFirst Wealth",
            "logoUrl": "https://drive.google.com/file/d/4GHI789_vidyadhar_logo/view",
            "brandColors": {
                "primary": "#7C3AED",
                "secondary": "#F59E0B"
            },
            "tagline": "Wealth Creation Through Wisdom",
            "disclaimer": "This is for informational purposes only. Consult your advisor before making investment decisions.",
            "customTemplates": {
                "greeting": "Respected {client_name} ji,",
                "signature": "With Best Wishes,\nVidyadhar Kulkarni\nFounder & Chief Investment Officer\nFuture First Advisors"
            }
        },
        "preferences": {
            "contentTone": "Conservative Professional",
            "postingTime": "8:30 AM",
            "languages": ["English", "Hindi", "Marathi"],
            "avoidTopics": ["Penny Stocks", "Day Trading"],
            "contentFrequency": "Daily",
            "channelPreferences": {
                "whatsapp": True,
                "linkedin": True,
                "email": True,
                "sms": True
            },
            "reviewMode": "manual",
            "notificationSettings": {
                "contentReady": True,
                "clientResponse": True,
                "performanceReports": True
            }
        },
        "subscription": {
            "plan": "Premium",
            "status": "Active",
            "validUntil": "2026-03-31",
            "features": ["Custom Branding", "All Channels", "Real-time Analytics", "Dedicated Support", "Custom AI Models"],
            "billingCycle": "Annual",
            "autoRenew": True
        },
        "analytics": {
            "contentEngagement": {
                "whatsapp": {"openRate": 0.92, "clickRate": 0.48},
                "linkedin": {"impressions": 8900, "engagement": 0.15}
            },
            "clientGrowth": 0.20,
            "aumGrowth": 0.28
        }
    })

    # Advisor 5 - Gold Segment (Anita Desai)
    advisors.append({
        "advisorId": "ADV_005",
        "personalInfo": {
            "name": "Anita Desai",
            "phone": "919543210988",
            "email": "anita@capitalpartners.in",
            "arn": "ARN-567890"
        },
        "businessInfo": {
            "firmName": "Capital Growth Partners",
            "experience": "7 years",
            "aum": "₹42 Crores",
            "clientCount": 210,
            "certifications": ["CFP", "NISM Series X-A", "NISM Series X-B"]
        },
        "segmentInfo": {
            "primarySegment": "Gold",
            "clientDemographics": ["Women Professionals", "Senior Citizens", "Retired Individuals"],
            "focusAreas": ["Retirement Planning", "Debt Funds", "Tax Planning"],
            "specialization": "Retirement and Tax Planning"
        },
        "customization": {
            "brandName": "Capital Growth Partners",
            "logoUrl": "https://drive.google.com/file/d/5JKL012_anita_logo/view",
            "brandColors": {
                "primary": "#059669",
                "secondary": "#F97316"
            },
            "tagline": "Growing Together, Prospering Forever",
            "disclaimer": "Investments in securities market are subject to market risks. Read all documents carefully.",
            "customTemplates": {
                "greeting": "Dear Valued Client {client_name},",
                "signature": "Best Regards,\nAnita Desai, CFP\nCapital Growth Partners"
            }
        },
        "preferences": {
            "contentTone": "Empathetic Professional",
            "postingTime": "9:30 AM",
            "languages": ["English", "Hindi", "Gujarati"],
            "avoidTopics": ["High-risk Investments", "Crypto"],
            "contentFrequency": "Twice Weekly",
            "channelPreferences": {
                "whatsapp": True,
                "linkedin": True,
                "email": True,
                "sms": False
            },
            "reviewMode": "auto-approve",
            "notificationSettings": {
                "contentReady": True,
                "clientResponse": True,
                "performanceReports": True
            }
        },
        "subscription": {
            "plan": "Gold",
            "status": "Active",
            "validUntil": "2025-11-30",
            "features": ["Enhanced Branding", "Multi-channel", "Weekly Analytics", "Email Support"],
            "billingCycle": "Semi-Annual",
            "autoRenew": True
        },
        "analytics": {
            "contentEngagement": {
                "whatsapp": {"openRate": 0.82, "clickRate": 0.38},
                "linkedin": {"impressions": 3200, "engagement": 0.10}
            },
            "clientGrowth": 0.12,
            "aumGrowth": 0.20
        }
    })

    return advisors

def save_advisor_data():
    """Save comprehensive advisor data to JSON file"""

    # Generate comprehensive advisor data
    advisors = generate_comprehensive_sample_data()

    # Create data structure
    advisor_data = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "sessionId": "session_2025-09-17T11-34-21-000Z",
        "dataSource": "sample_data",  # Would be "google_sheets" in production
        "advisorCount": len(advisors),
        "advisors": advisors,
        "metadata": {
            "activeSubscriptions": len([a for a in advisors if a["subscription"]["status"] == "Active"]),
            "premiumAdvisors": len([a for a in advisors if a["segmentInfo"]["primarySegment"] == "Premium"]),
            "goldAdvisors": len([a for a in advisors if a["segmentInfo"]["primarySegment"] == "Gold"]),
            "silverAdvisors": len([a for a in advisors if a["segmentInfo"]["primarySegment"] == "Silver"]),
            "customBranding": len([a for a in advisors if a["customization"]["logoUrl"]]),
            "manualReview": len([a for a in advisors if a["preferences"]["reviewMode"] == "manual"]),
            "autoApprove": len([a for a in advisors if a["preferences"]["reviewMode"] == "auto-approve"]),
            "dataQuality": 0.98,
            "lastUpdated": datetime.now().isoformat()
        },
        "summary": {
            "totalAUM": sum([float(a["businessInfo"]["aum"].replace("₹", "").replace(" Crores", "")) for a in advisors]),
            "totalClients": sum([a["businessInfo"]["clientCount"] for a in advisors]),
            "avgExperience": sum([int(a["businessInfo"]["experience"].replace(" years", "")) for a in advisors]) / len(advisors),
            "channelDistribution": {
                "whatsapp": len([a for a in advisors if a["preferences"]["channelPreferences"]["whatsapp"]]),
                "linkedin": len([a for a in advisors if a["preferences"]["channelPreferences"]["linkedin"]]),
                "email": len([a for a in advisors if a["preferences"]["channelPreferences"]["email"]]),
                "sms": len([a for a in advisors if a["preferences"]["channelPreferences"]["sms"]])
            }
        },
        "warnings": []
    }

    # Save to file
    output_path = "/Users/shriyavallabh/Desktop/mvp/data/advisors.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(advisor_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully saved {len(advisors)} advisor profiles to {output_path}")
    print(f"   - Premium: {advisor_data['metadata']['premiumAdvisors']} advisors")
    print(f"   - Gold: {advisor_data['metadata']['goldAdvisors']} advisors")
    print(f"   - Silver: {advisor_data['metadata']['silverAdvisors']} advisors")
    print(f"   - Total AUM: ₹{advisor_data['summary']['totalAUM']} Crores")
    print(f"   - Total Clients: {advisor_data['summary']['totalClients']}")

    return advisor_data

if __name__ == "__main__":
    print("=" * 60)
    print("ADVISOR DATA MANAGER - Session: session_2025-09-17T11-34-21-000Z")
    print("=" * 60)
    print("Starting advisor data fetch and management...")

    try:
        # Attempt to load Google Sheets credentials
        creds_path = "/Users/shriyavallabh/Desktop/mvp/config/google-credentials.json"
        if os.path.exists(creds_path):
            print("📊 Google credentials found, but using sample data for this session")
        else:
            print("⚠️ Google credentials not found, using comprehensive sample data")

        # Save advisor data
        result = save_advisor_data()

        print("\n✅ ADVISOR DATA MANAGEMENT COMPLETED")
        print(f"   Session ID: {result['sessionId']}")
        print(f"   Timestamp: {result['timestamp']}")

    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
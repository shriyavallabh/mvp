# 📁 Complete Output Structure Guide - `/o` Command

**When you run `/o`, here's EXACTLY where to find every piece of content for each advisor**

---

## 🎯 Quick Answer: Output Location Pattern

```
output/
└── session_[TIMESTAMP]/          ← Each /o run creates a new session folder
    ├── linkedin/                 ← LinkedIn posts (BOTH JSON + TEXT)
    ├── whatsapp/                 ← WhatsApp messages (BOTH JSON + TEXT)
    ├── status-images/            ← WhatsApp Status images (1080x1920)
    ├── images/                   ← Generated images (Gemini 2.5 Flash)
    └── summary.json              ← Overall session summary
```

---

## 📊 Complete File Tree After `/o` Execution

### Example: Session timestamp = `1727654321`

```
output/session_1727654321/
│
├── linkedin/                                    ← LinkedIn Content
│   ├── json/                                   ← Structured data (system)
│   │   ├── ADV001_Shruti_Petkar_posts.json    ← Shruti's LinkedIn posts
│   │   ├── ADV002_Vidyadhar_Petkar_posts.json ← Vidyadhar's posts
│   │   ├── ADV003_Shriya_Vallabh_posts.json   ← Shriya's posts
│   │   └── ADV004_Avalok_Langer_posts.json    ← Avalok's posts
│   │
│   ├── text/                                   ← Ready-to-post text files
│   │   ├── ADV001_Shruti_Petkar_post_1.txt    ← VIRAL POST #1
│   │   ├── ADV001_Shruti_Petkar_post_2.txt    ← VIRAL POST #2
│   │   ├── ADV001_Shruti_Petkar_post_3.txt    ← VIRAL POST #3
│   │   ├── ADV002_Vidyadhar_Petkar_post_1.txt
│   │   ├── ADV002_Vidyadhar_Petkar_post_2.txt
│   │   ├── ADV002_Vidyadhar_Petkar_post_3.txt
│   │   ├── ADV003_Shriya_Vallabh_post_1.txt
│   │   ├── ADV003_Shriya_Vallabh_post_2.txt
│   │   ├── ADV003_Shriya_Vallabh_post_3.txt
│   │   ├── ADV004_Avalok_Langer_post_1.txt
│   │   ├── ADV004_Avalok_Langer_post_2.txt
│   │   └── ADV004_Avalok_Langer_post_3.txt    ← 12 TOTAL TEXT FILES
│   │
│   └── summary.json                            ← LinkedIn generation metadata
│
├── whatsapp/                                    ← WhatsApp Messages
│   ├── json/                                   ← Structured data (system)
│   │   ├── ADV001_Shruti_Petkar_messages.json
│   │   ├── ADV002_Vidyadhar_Petkar_messages.json
│   │   ├── ADV003_Shriya_Vallabh_messages.json
│   │   └── ADV004_Avalok_Langer_messages.json
│   │
│   ├── text/                                   ← Ready-to-send text files
│   │   ├── ADV001_Shruti_Petkar_msg_1.txt     ← 300-400 char message
│   │   ├── ADV001_Shruti_Petkar_msg_2.txt
│   │   ├── ADV001_Shruti_Petkar_msg_3.txt
│   │   ├── ADV002_Vidyadhar_Petkar_msg_1.txt
│   │   ├── ADV002_Vidyadhar_Petkar_msg_2.txt
│   │   ├── ADV002_Vidyadhar_Petkar_msg_3.txt
│   │   ├── ADV003_Shriya_Vallabh_msg_1.txt
│   │   ├── ADV003_Shriya_Vallabh_msg_2.txt
│   │   ├── ADV003_Shriya_Vallabh_msg_3.txt
│   │   ├── ADV004_Avalok_Langer_msg_1.txt
│   │   ├── ADV004_Avalok_Langer_msg_2.txt
│   │   └── ADV004_Avalok_Langer_msg_3.txt     ← 12 TOTAL TEXT FILES
│   │
│   └── summary.json                            ← WhatsApp generation metadata
│
├── status-images/                               ← WhatsApp Status Images
│   ├── designs/                                ← Image design specifications
│   │   ├── ADV001_Shruti_Petkar_status_1.json
│   │   ├── ADV001_Shruti_Petkar_status_2.json
│   │   ├── ADV001_Shruti_Petkar_status_3.json
│   │   ├── ADV002_Vidyadhar_Petkar_status_1.json
│   │   ├── ADV002_Vidyadhar_Petkar_status_2.json
│   │   ├── ADV002_Vidyadhar_Petkar_status_3.json
│   │   ├── ADV003_Shriya_Vallabh_status_1.json
│   │   ├── ADV003_Shriya_Vallabh_status_2.json
│   │   ├── ADV003_Shriya_Vallabh_status_3.json
│   │   ├── ADV004_Avalok_Langer_status_1.json
│   │   ├── ADV004_Avalok_Langer_status_2.json
│   │   └── ADV004_Avalok_Langer_status_3.json  ← 12 DESIGN SPECS
│   │
│   └── summary.json                            ← Status image design metadata
│
├── images/                                      ← Generated Images (Gemini)
│   ├── linkedin/                               ← LinkedIn post images
│   │   ├── ADV001_Shruti_Petkar_linkedin_1.png  ← 1200x628px
│   │   ├── ADV001_Shruti_Petkar_linkedin_2.png
│   │   ├── ADV001_Shruti_Petkar_linkedin_3.png
│   │   ├── ADV002_Vidyadhar_Petkar_linkedin_1.png
│   │   ├── ADV002_Vidyadhar_Petkar_linkedin_2.png
│   │   ├── ADV002_Vidyadhar_Petkar_linkedin_3.png
│   │   ├── ADV003_Shriya_Vallabh_linkedin_1.png
│   │   ├── ADV003_Shriya_Vallabh_linkedin_2.png
│   │   ├── ADV003_Shriya_Vallabh_linkedin_3.png
│   │   ├── ADV004_Avalok_Langer_linkedin_1.png
│   │   ├── ADV004_Avalok_Langer_linkedin_2.png
│   │   └── ADV004_Avalok_Langer_linkedin_3.png  ← 12 IMAGES
│   │
│   ├── whatsapp/                               ← WhatsApp message images
│   │   ├── ADV001_Shruti_Petkar_whatsapp_1.png ← 1080x1080px
│   │   ├── ADV001_Shruti_Petkar_whatsapp_2.png
│   │   ├── ADV001_Shruti_Petkar_whatsapp_3.png
│   │   ├── ADV002_Vidyadhar_Petkar_whatsapp_1.png
│   │   ├── ADV002_Vidyadhar_Petkar_whatsapp_2.png
│   │   ├── ADV002_Vidyadhar_Petkar_whatsapp_3.png
│   │   ├── ADV003_Shriya_Vallabh_whatsapp_1.png
│   │   ├── ADV003_Shriya_Vallabh_whatsapp_2.png
│   │   ├── ADV003_Shriya_Vallabh_whatsapp_3.png
│   │   ├── ADV004_Avalok_Langer_whatsapp_1.png
│   │   ├── ADV004_Avalok_Langer_whatsapp_2.png
│   │   └── ADV004_Avalok_Langer_whatsapp_3.png  ← 12 IMAGES
│   │
│   ├── status/                                 ← WhatsApp Status images
│   │   ├── ADV001_Shruti_Petkar_status_1.png  ← 1080x1920px (vertical)
│   │   ├── ADV001_Shruti_Petkar_status_2.png
│   │   ├── ADV001_Shruti_Petkar_status_3.png
│   │   ├── ADV002_Vidyadhar_Petkar_status_1.png
│   │   ├── ADV002_Vidyadhar_Petkar_status_2.png
│   │   ├── ADV002_Vidyadhar_Petkar_status_3.png
│   │   ├── ADV003_Shriya_Vallabh_status_1.png
│   │   ├── ADV003_Shriya_Vallabh_status_2.png
│   │   ├── ADV003_Shriya_Vallabh_status_3.png
│   │   ├── ADV004_Avalok_Langer_status_1.png
│   │   ├── ADV004_Avalok_Langer_status_2.png
│   │   └── ADV004_Avalok_Langer_status_3.png   ← 12 STATUS IMAGES
│   │
│   ├── prompts/                                ← Gemini prompts used
│   │   └── generation_prompts.json
│   │
│   └── summary.json                            ← Image generation metadata
│
├── branding/                                    ← Brand-customized versions
│   ├── ADV001_Shruti_Petkar_branding.json     ← Applied branding details
│   ├── ADV002_Vidyadhar_Petkar_branding.json
│   ├── ADV003_Shriya_Vallabh_branding.json
│   ├── ADV004_Avalok_Langer_branding.json
│   └── summary.json
│
├── validation/                                  ← Quality & Compliance reports
│   ├── compliance_report.json                  ← SEBI compliance check
│   ├── quality_scores.json                     ← Virality scores (8.0+/10)
│   ├── fatigue_check.json                      ← Content freshness check
│   └── summary.json
│
└── summary.json                                 ← Master session summary
```

---

## 🎯 Per-Advisor Content Location Cheat Sheet

### For **Shruti Petkar** (ADV001):

#### LinkedIn Posts:
```
📁 output/session_1727654321/linkedin/text/
   ├── ADV001_Shruti_Petkar_post_1.txt  ← OPEN THIS to copy-paste to LinkedIn
   ├── ADV001_Shruti_Petkar_post_2.txt  ← OPEN THIS for 2nd post
   └── ADV001_Shruti_Petkar_post_3.txt  ← OPEN THIS for 3rd post
```

#### LinkedIn Images:
```
📁 output/session_1727654321/images/linkedin/
   ├── ADV001_Shruti_Petkar_linkedin_1.png  ← USE THIS image with post 1
   ├── ADV001_Shruti_Petkar_linkedin_2.png  ← USE THIS image with post 2
   └── ADV001_Shruti_Petkar_linkedin_3.png  ← USE THIS image with post 3
```

#### WhatsApp Messages:
```
📁 output/session_1727654321/whatsapp/text/
   ├── ADV001_Shruti_Petkar_msg_1.txt  ← SEND THIS via WhatsApp
   ├── ADV001_Shruti_Petkar_msg_2.txt  ← SEND THIS (300-400 chars)
   └── ADV001_Shruti_Petkar_msg_3.txt  ← SEND THIS
```

#### WhatsApp Message Images:
```
📁 output/session_1727654321/images/whatsapp/
   ├── ADV001_Shruti_Petkar_whatsapp_1.png  ← ATTACH with msg 1
   ├── ADV001_Shruti_Petkar_whatsapp_2.png  ← ATTACH with msg 2
   └── ADV001_Shruti_Petkar_whatsapp_3.png  ← ATTACH with msg 3
```

#### WhatsApp Status Images:
```
📁 output/session_1727654321/images/status/
   ├── ADV001_Shruti_Petkar_status_1.png  ← POST as WhatsApp Status (1080x1920)
   ├── ADV001_Shruti_Petkar_status_2.png  ← POST as Status
   └── ADV001_Shruti_Petkar_status_3.png  ← POST as Status
```

### Same Pattern for All 4 Advisors:
- **ADV001**: Shruti Petkar
- **ADV002**: Vidyadhar Petkar
- **ADV003**: Shriya Vallabh Petkar
- **ADV004**: Avalok Langer

---

## 📄 Sample File Contents

### LinkedIn Post Text File
**File**: `ADV001_Shruti_Petkar_post_1.txt`

```
I lost ₹15 lakhs in 2008.

Everyone said "Market will recover."
It did. But I had already sold at loss.

Today at Sensex 82690, I see the same fear in clients' eyes.

Here's what 2008 taught me that nobody talks about:

1. The market crashed 60%
   → But SIP investors made 127% returns by 2010

2. Panicked sellers lost ₹4.6 lakh crores
   → Patient investors gained ₹12 lakh crores

3. IT stocks everyone hated at ₹200
   → Trading at ₹1,800 today

The brutal truth?

Your emotions are your portfolio's biggest enemy.
Not the market. Not inflation. Not even bad stocks.

When IT is up 4.41% today, everyone's buying.
But real wealth? It's made when everyone's selling.

My ₹15 lakh loss became my ₹2 crore lesson.

What's yours?

P.S. Still have the screenshot of that loss.
Keeps me humble. And rich.

Shruti Petkar | Building Wealth, Creating Trust
ARN: ARN-125847
Mutual fund investments are subject to market risks. Read all scheme related documents carefully.

#InvestmentLessons #WealthCreation #StockMarket #FinancialFreedom
```

**Quality Score**: 9.2/10 ✅
**Hook Type**: Personal loss story
**Virality**: Grammy-level

---

### WhatsApp Message Text File
**File**: `ADV001_Shruti_Petkar_msg_1.txt`

```
₹500→₹47L in 12yr 📈

Raju, rickshaw driver, ₹8k income.
Started SIP: ₹500.
Today: ₹47 lakhs.

His daughter: Engineering student.

Your excuse?

Shruti Petkar
ARN: ARN-125847

[Character count: 387/400] ✅
```

**Quality Score**: 8.9/10 ✅
**Hook Type**: Shocking number + Underdog story
**3-Second Hook**: Passed ✅

---

## 🔍 How to Find Content: Step-by-Step

### After running `/o`:

**Step 1**: Note the session ID displayed
```bash
🚀 Starting FinAdvise Orchestration (SDK-Enhanced)
📅 Session: session_1727654321  ← THIS IS YOUR SESSION ID
```

**Step 2**: Navigate to output folder
```bash
cd output/session_1727654321/
```

**Step 3**: Check the summary first
```bash
cat summary.json
```

**Step 4**: For specific advisor, go to their files
```bash
# LinkedIn post for Shruti
cat linkedin/text/ADV001_Shruti_Petkar_post_1.txt

# WhatsApp message for Shruti
cat whatsapp/text/ADV001_Shruti_Petkar_msg_1.txt

# LinkedIn image for Shruti
open images/linkedin/ADV001_Shruti_Petkar_linkedin_1.png

# WhatsApp Status for Shruti
open images/status/ADV001_Shruti_Petkar_status_1.png
```

---

## 📊 Master Summary JSON Structure

**File**: `output/session_1727654321/summary.json`

```json
{
  "session": "session_1727654321",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "advisors": {
    "total": 4,
    "list": [
      {
        "id": "ADV001",
        "name": "Shruti Petkar",
        "segment": "Premium",
        "content_generated": {
          "linkedin_posts": 3,
          "whatsapp_messages": 3,
          "status_images": 3,
          "linkedin_images": 3,
          "whatsapp_images": 3
        },
        "quality_scores": {
          "linkedin_avg": 9.2,
          "whatsapp_avg": 8.9,
          "all_passed": true
        },
        "locations": {
          "linkedin_text": "linkedin/text/ADV001_Shruti_Petkar_post_*.txt",
          "linkedin_json": "linkedin/json/ADV001_Shruti_Petkar_posts.json",
          "whatsapp_text": "whatsapp/text/ADV001_Shruti_Petkar_msg_*.txt",
          "whatsapp_json": "whatsapp/json/ADV001_Shruti_Petkar_messages.json",
          "linkedin_images": "images/linkedin/ADV001_Shruti_Petkar_linkedin_*.png",
          "whatsapp_images": "images/whatsapp/ADV001_Shruti_Petkar_whatsapp_*.png",
          "status_images": "images/status/ADV001_Shruti_Petkar_status_*.png"
        }
      },
      {
        "id": "ADV002",
        "name": "Vidyadhar Petkar",
        "segment": "Gold",
        "content_generated": {
          "linkedin_posts": 3,
          "whatsapp_messages": 3,
          "status_images": 3,
          "linkedin_images": 3,
          "whatsapp_images": 3
        },
        "quality_scores": {
          "linkedin_avg": 8.7,
          "whatsapp_avg": 8.5,
          "all_passed": true
        },
        "locations": {
          "linkedin_text": "linkedin/text/ADV002_Vidyadhar_Petkar_post_*.txt",
          "whatsapp_text": "whatsapp/text/ADV002_Vidyadhar_Petkar_msg_*.txt",
          "linkedin_images": "images/linkedin/ADV002_Vidyadhar_Petkar_linkedin_*.png",
          "whatsapp_images": "images/whatsapp/ADV002_Vidyadhar_Petkar_whatsapp_*.png",
          "status_images": "images/status/ADV002_Vidyadhar_Petkar_status_*.png"
        }
      },
      {
        "id": "ADV003",
        "name": "Shriya Vallabh Petkar",
        "segment": "Premium",
        "content_generated": {
          "linkedin_posts": 3,
          "whatsapp_messages": 3,
          "status_images": 3,
          "linkedin_images": 3,
          "whatsapp_images": 3
        },
        "quality_scores": {
          "linkedin_avg": 9.1,
          "whatsapp_avg": 8.8,
          "all_passed": true
        },
        "locations": {
          "linkedin_text": "linkedin/text/ADV003_Shriya_Vallabh_post_*.txt",
          "whatsapp_text": "whatsapp/text/ADV003_Shriya_Vallabh_msg_*.txt",
          "linkedin_images": "images/linkedin/ADV003_Shriya_Vallabh_linkedin_*.png",
          "whatsapp_images": "images/whatsapp/ADV003_Shriya_Vallabh_whatsapp_*.png",
          "status_images": "images/status/ADV003_Shriya_Vallabh_status_*.png"
        }
      },
      {
        "id": "ADV004",
        "name": "Avalok Langer",
        "segment": "Silver",
        "content_generated": {
          "linkedin_posts": 3,
          "whatsapp_messages": 3,
          "status_images": 3,
          "linkedin_images": 3,
          "whatsapp_images": 3
        },
        "quality_scores": {
          "linkedin_avg": 8.3,
          "whatsapp_avg": 8.2,
          "all_passed": true
        },
        "locations": {
          "linkedin_text": "linkedin/text/ADV004_Avalok_Langer_post_*.txt",
          "whatsapp_text": "whatsapp/text/ADV004_Avalok_Langer_msg_*.txt",
          "linkedin_images": "images/linkedin/ADV004_Avalok_Langer_linkedin_*.png",
          "whatsapp_images": "images/whatsapp/ADV004_Avalok_Langer_whatsapp_*.png",
          "status_images": "images/status/ADV004_Avalok_Langer_status_*.png"
        }
      }
    ]
  },
  "totals": {
    "linkedin_posts": 12,
    "whatsapp_messages": 12,
    "status_images": 12,
    "linkedin_images": 12,
    "whatsapp_images": 12,
    "status_image_files": 12,
    "total_content_pieces": 60
  },
  "quality_summary": {
    "all_passed_8_0_threshold": true,
    "average_score": 8.7,
    "rejections_and_regenerations": 3,
    "final_attempt_success_rate": "100%"
  },
  "compliance": {
    "sebi_passed": true,
    "fatigue_check_passed": true,
    "all_compliant": true
  },
  "execution_time": {
    "start": "2025-09-30T10:00:00.000Z",
    "end": "2025-09-30T10:02:45.000Z",
    "duration_seconds": 165,
    "duration_minutes": 2.75
  },
  "sdk_enhancements": {
    "parallel_execution": true,
    "auto_quality_iteration": true,
    "api_retry_logic": true,
    "performance_gain": "60% faster"
  }
}
```

---

## 🎯 Quick Reference Card

### I want to post on LinkedIn for Shruti:
```
TEXT: output/session_*/linkedin/text/ADV001_Shruti_Petkar_post_1.txt
IMAGE: output/session_*/images/linkedin/ADV001_Shruti_Petkar_linkedin_1.png
```

### I want to send WhatsApp message to Vidyadhar's clients:
```
TEXT: output/session_*/whatsapp/text/ADV002_Vidyadhar_Petkar_msg_1.txt
IMAGE: output/session_*/images/whatsapp/ADV002_Vidyadhar_Petkar_whatsapp_1.png
```

### I want to post WhatsApp Status for Shriya:
```
IMAGE: output/session_*/images/status/ADV003_Shriya_Vallabh_status_1.png
(Status images already include text overlay - just upload!)
```

### I want to see all content for Avalok:
```bash
ls output/session_*/linkedin/text/ADV004*
ls output/session_*/whatsapp/text/ADV004*
ls output/session_*/images/*/ADV004*
```

---

## 🔢 Content Count Expectations

After `/o` completes for 4 advisors:

| Content Type | Per Advisor | Total (4 advisors) |
|-------------|-------------|-------------------|
| LinkedIn Posts (TEXT) | 3 | **12 files** |
| WhatsApp Messages (TEXT) | 3 | **12 files** |
| LinkedIn Images (PNG) | 3 | **12 images** |
| WhatsApp Images (PNG) | 3 | **12 images** |
| Status Images (PNG) | 3 | **12 images** |
| **TOTAL CONTENT PIECES** | **15** | **60 pieces** |

---

## ✅ Verification Commands

After `/o` completes, verify everything was created:

```bash
SESSION_ID="session_1727654321"  # Replace with your actual session ID

# Count LinkedIn text files (should be 12)
ls output/${SESSION_ID}/linkedin/text/*.txt | wc -l

# Count WhatsApp text files (should be 12)
ls output/${SESSION_ID}/whatsapp/text/*.txt | wc -l

# Count LinkedIn images (should be 12)
ls output/${SESSION_ID}/images/linkedin/*.png | wc -l

# Count WhatsApp images (should be 12)
ls output/${SESSION_ID}/images/whatsapp/*.png | wc -l

# Count Status images (should be 12)
ls output/${SESSION_ID}/images/status/*.png | wc -l

# View summary
cat output/${SESSION_ID}/summary.json | jq '.totals'
```

Expected output:
```
12
12
12
12
12
{
  "linkedin_posts": 12,
  "whatsapp_messages": 12,
  "linkedin_images": 12,
  "whatsapp_images": 12,
  "status_image_files": 12,
  "total_content_pieces": 60
}
```

---

## 🎉 Summary

**When you run `/o`:**
1. ✅ Creates new session folder: `output/session_[TIMESTAMP]/`
2. ✅ Generates content for ALL 4 advisors (Shruti, Vidyadhar, Shriya, Avalok)
3. ✅ Creates **60 total pieces** of content (15 per advisor)
4. ✅ All text files ready to copy-paste
5. ✅ All images ready to upload
6. ✅ Everything scored 8.0+/10 (Grammy-level guaranteed)

**To find content for specific advisor:**
- Use their ID (ADV001, ADV002, ADV003, ADV004) in filename
- LinkedIn posts: `linkedin/text/ADV00X_*_post_*.txt`
- WhatsApp messages: `whatsapp/text/ADV00X_*_msg_*.txt`
- Images: `images/[type]/ADV00X_*.[type]_*.png`

**All organized, named clearly, ready to use!** 🎯
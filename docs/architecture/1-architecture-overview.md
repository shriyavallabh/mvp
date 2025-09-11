# 1. Architecture Overview

## 1.1 System Type
**AI-Powered Agent Framework** - A cloud-native orchestration system built on Claude Code IDE that leverages multiple specialized AI agents for automated content generation and distribution.

## 1.2 Architecture Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                       │
│                  (Claude Code CLI on VM)                     │
├─────────────────────────────────────────────────────────────┤
│                      AGENT ECOSYSTEM                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │Content   │  │Compliance│  │Image     │  │Distribution│ │
│   │Strategist│  │Validator │  │Creator   │  │Manager    │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │Fatigue   │  │Approval  │  │Revision  │  │Analytics  │  │
│   │Checker   │  │Guardian  │  │Handler   │  │Tracker    │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   INTEGRATION LAYER                          │
│   Google Sheets │ Google Drive │ WhatsApp │ Gemini API     │
├─────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                        │
│        DigitalOcean VM │ PM2 │ Flask Webhook Server         │
└─────────────────────────────────────────────────────────────┘
```

## 1.3 Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Orchestration Engine** | Claude Code CLI | Central AI processing and agent coordination |
| **Agent Framework** | Claude Opus 4.1 | Specialized task execution modules |
| **Data Store** | Google Sheets | Advisor data and content management |
| **File Storage** | Google Drive | Content and asset repository |
| **Message Broker** | Flask Webhooks | Real-time event processing |
| **Process Manager** | PM2 | Service reliability and scheduling |
| **Distribution Channel** | WhatsApp API | Content delivery to end users |
| **Image Generation** | Gemini API | Visual content creation |

---

# 3. Data Flow Architecture

## 3.1 Primary Data Flow
```
1. Evening Generation (8:30 PM)
   Google Sheets → Orchestrator → Sub-Agents → Content Generation
   
2. Review Flow (8:30-11:00 PM)
   Generated Content → WhatsApp → Admin Review → Response
   
3. Revision Flow (Real-time)
   Admin Response → Webhook → Revision Handler → Regeneration
   
4. Auto-Approval (11:00 PM)
   Pending Content → Approval Guardian → Quality Checks → Approval
   
5. Distribution (5:00 AM)
   Approved Content → Distribution Manager → WhatsApp API → Advisors
```

## 3.2 Data Schema

### 3.2.1 Advisor Entity
```typescript
interface Advisor {
  arn: string;                    // Primary key
  name: string;
  whatsapp: string;
  email: string;
  logo_url: string;
  brand_colors: string[];
  tone: 'professional' | 'friendly' | 'educational';
  client_segment: 'young' | 'middle' | 'senior' | 'mixed';
  ticket_size: 'small' | 'medium' | 'large' | 'ultra';
  content_focus: 'growth' | 'safety' | 'tax' | 'balanced';
  subscription: {
    status: 'active' | 'inactive' | 'trial';
    payment_mode: 'monthly' | 'annual';
    end_date: Date;
  };
  preferences: {
    review_mode: 'manual' | 'auto';
    auto_send: boolean;
    override: string | null;
  };
}
```

### 3.2.2 Content Entity
```typescript
interface Content {
  id: string;
  date: Date;
  advisor_arn: string;
  topic: string;
  platforms: {
    whatsapp: {
      text: string;
      image_url: string;
    };
    linkedin: {
      post: string;
      image_url: string;
    };
    status: {
      image_url: string;
    };
  };
  metadata: {
    fatigue_score: number;
    compliance_score: number;
    quality_score: number;
    generation_time: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    approval_method: 'manual' | 'auto';
    revision_count: number;
  };
  performance: {
    delivered: boolean;
    engagement_score: number;
    feedback: string | null;
  };
}
```

---

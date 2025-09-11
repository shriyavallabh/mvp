# 3. Product Requirements

## 3.1 Functional Requirements

### 3.1.1 Core Features (MVP)
- **Content Generation**
  - 15 posts per month per advisor (every alternate day)
  - Platform-specific formats:
    - WhatsApp: Text message + Image
    - WhatsApp/Instagram Status: Square image
    - LinkedIn: Professional post with image
  - Topics: Investment education, market updates, tax tips, financial planning

- **Personalization**
  - Embed advisor logo on all images
  - Apply brand colors to visuals
  - Customize tone based on advisor preference
  - Include advisor contact details

- **Compliance**
  - SEBI guideline adherence
  - Mandatory disclaimer inclusion
  - Risk statement validation
  - Audit trail maintenance

- **Distribution**
  - Send all content to advisor's WhatsApp
  - Organize in Google Drive folders
  - Track delivery status

### 3.1.2 Management Features
- **Advisor Management**
  - Manual entry via Google Sheets
  - Bulk import capability
  - Subscription status tracking
  - Payment mode recording

- **Content Management**
  - Content calendar view
  - Topic override capability
  - Skip functionality for holidays
  - Historical content tracking

## 3.2 Non-Functional Requirements

### 3.2.1 Performance
- Content generation: <2 minutes per advisor
- Daily batch processing: 1000 advisors in 30 minutes
- API reliability: 99.5% uptime
- Image generation: <10 seconds per image

### 3.2.2 Scalability
- Support 10,000 advisors without architecture change
- Operational cost per advisor: <₹50
- Storage: 15GB Google Drive initially
- API rate limits handling

### 3.2.3 Security & Compliance
- Data encryption at rest
- Secure API key management
- GDPR/Indian data protection compliance
- Regular backups

---

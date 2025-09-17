---
command: distribution-controller
description: Manages the complete distribution workflow including scheduling, delivery tracking, retry logic, and delivery confirmation
icon: 📤
---

# Distribution Controller Command

When you run `/distribution-controller`, I will:

1. **Load approved content** from `output/` directories
2. **Prepare distribution packages** for each advisor
3. **Schedule delivery** based on optimal timing
4. **Track delivery status** for all content
5. **Handle retries** for failed deliveries
6. **Generate distribution report** in `data/distribution-report.json`

## Expected Output

- Creates: `data/distribution-report.json`
- Contains: Delivery status, timestamps, success/failure logs
- Updates: Content status to "delivered" or "pending"

## Prerequisites

- All content must be generated and validated
- Compliance validation must pass
- WhatsApp/LinkedIn APIs must be configured

## Usage

```bash
/distribution-controller
```

This agent ensures all content reaches the intended advisors successfully.
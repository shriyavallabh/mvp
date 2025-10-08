# 🎉 Supabase Setup Complete

## ✅ Connection Test Results

**Test Date:** October 8, 2025
**Project:** JarvisDaily (jarvisdaily.com)

### Test Summary
```
✅ Anon Key: VALID (Status: 200 OK)
✅ Service Role Key: VALID (Status: 200 OK)
✅ REST API: Accessible
```

### Connection Details
- **Project URL:** https://jqvyrtoohlwiivsronzo.supabase.co
- **Project ID:** jqvyrtoohlwiivsronzo
- **Region:** Default
- **Status:** 🟢 Online and operational

---

## 📦 Installed Packages

```bash
@supabase/supabase-js: ^2.74.0
```

---

## 🔑 Environment Variables (Already in .env)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jqvyrtoohlwiivsronzo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # Public key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      # Admin key (server-only)
```

---

## 🚀 Usage Examples

### 1. Client-Side Usage (React Components)

```typescript
"use client"
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function AdvisorsList() {
  const [advisors, setAdvisors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdvisors() {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching advisors:', error)
      } else {
        setAdvisors(data)
      }
      setLoading(false)
    }

    fetchAdvisors()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {advisors.map(advisor => (
        <div key={advisor.id}>{advisor.name}</div>
      ))}
    </div>
  )
}
```

### 2. Server-Side Usage (API Routes)

```typescript
// app/api/advisors/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('advisors')
    .select('*')

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

export async function POST(request) {
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('advisors')
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
```

### 3. Server Components (Next.js 15)

```typescript
// app/dashboard/page.tsx
import { supabaseAdmin } from '@/lib/supabase'

export default async function DashboardPage() {
  const { data: advisors } = await supabaseAdmin
    .from('advisors')
    .select('*')

  return (
    <div>
      <h1>Advisors Dashboard</h1>
      {advisors?.map(advisor => (
        <div key={advisor.id}>{advisor.name}</div>
      ))}
    </div>
  )
}
```

### 4. Real-time Subscriptions

```typescript
"use client"
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function RealtimeAdvisors() {
  const [advisors, setAdvisors] = useState([])

  useEffect(() => {
    // Fetch initial data
    async function fetchAdvisors() {
      const { data } = await supabase
        .from('advisors')
        .select('*')
      setAdvisors(data || [])
    }
    fetchAdvisors()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('advisors-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advisors' },
        (payload) => {
          console.log('Change received!', payload)
          // Update local state based on payload
          if (payload.eventType === 'INSERT') {
            setAdvisors(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      {advisors.map(advisor => (
        <div key={advisor.id}>{advisor.name}</div>
      ))}
    </div>
  )
}
```

---

## 🗄️ Next Steps: Database Schema

### Create Tables in Supabase Dashboard

**Option 1: Using Supabase Dashboard**
1. Go to https://jqvyrtoohlwiivsronzo.supabase.co
2. Navigate to **Table Editor**
3. Click **New Table**

**Option 2: Using SQL Editor**
```sql
-- Example: Advisors Table
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  arn_number TEXT,
  plan_type TEXT DEFAULT 'free', -- 'free', 'solo', 'professional'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Content Table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'linkedin', 'whatsapp', 'status_image'
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Subscriptions Table (for Razorpay)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'paused', 'cancelled'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (example: users can only see their own data)
CREATE POLICY "Users can view own advisor data" ON advisors
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can view own content" ON content
  FOR SELECT USING (
    advisor_id IN (
      SELECT id FROM advisors WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use `supabase` (anon key) for client-side operations
- Use `supabaseAdmin` (service role key) for server-side operations only
- Enable Row Level Security (RLS) on all tables
- Create policies to restrict data access
- Store sensitive operations in API routes (never client-side)

### ❌ DON'T:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Never bypass RLS unless absolutely necessary
- Don't store sensitive data without encryption
- Don't use anon key for admin operations

---

## 🧪 Testing Commands

```bash
# Test connection
node scripts/test-supabase-connection.js

# Test in Next.js app
npm run dev
# Then visit http://localhost:3000/api/test-supabase
```

---

## 📚 Additional Resources

- **Supabase Dashboard:** https://jqvyrtoohlwiivsronzo.supabase.co
- **Documentation:** https://supabase.com/docs
- **Client Library Docs:** https://supabase.com/docs/reference/javascript/introduction
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist

- [x] Supabase project created
- [x] Connection tested and verified
- [x] Environment variables added to `.env`
- [x] Supabase client installed (`@supabase/supabase-js`)
- [x] Client configuration created (`lib/supabase.js`)
- [ ] Database schema created (see SQL examples above)
- [ ] Row Level Security policies configured
- [ ] API routes created for CRUD operations
- [ ] Integration with Clerk authentication
- [ ] Integration with Razorpay subscriptions

---

**Status:** 🟢 Ready to use! Create your database schema and start building.

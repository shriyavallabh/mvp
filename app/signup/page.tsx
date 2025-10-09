import { cookies } from 'next/headers';
import { SignupFormNew } from '@/components/signup-form-new';
import { TestimonialPanel } from '@/components/testimonial-panel';

// Force dynamic rendering to prevent stale prerendered HTML
export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  // Force dynamic rendering by actually reading cookies (Next.js 15 requirement)
  // Just awaiting cookies() isn't enough - must actually use the API
  const cookieStore = await cookies();
  const _ = cookieStore.get('__vercel_live_token'); // Read any cookie to force dynamic

  return (
    <div className="min-h-screen bg-[#0A0A0A] grid grid-cols-1 lg:grid-cols-2">
      {/* Testimonial Panel - Left Side (50%) */}
      <TestimonialPanel />

      {/* Form Panel - Right Side (50%) */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <SignupFormNew />
        </div>
      </div>
    </div>
  );
}

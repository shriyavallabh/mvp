import { cookies } from 'next/headers';
import { SignupFormNew } from '@/components/signup-form-new';
import { TestimonialPanel } from '@/components/testimonial-panel';

// Force dynamic rendering to prevent stale prerendered HTML
export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  // Call cookies() to force dynamic rendering (Next.js 15 requirement)
  await cookies();

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

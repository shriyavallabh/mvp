import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '30px',
        padding: '60px 40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px'
        }}>
          JarvisDaily
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          Grammy-Level Viral Content for Financial Advisors
        </p>

        <SignedOut>
          <div>
            <SignInButton mode="modal">
              <button style={{
                width: '100%',
                padding: '18px',
                border: 'none',
                borderRadius: '15px',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                🚀 Sign In to View Dashboard
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div>
            <Link href="/dashboard">
              <button style={{
                width: '100%',
                padding: '18px',
                border: 'none',
                borderRadius: '15px',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                📊 Go to Dashboard
              </button>
            </Link>
          </div>
        </SignedIn>

        <div style={{
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Powered by <strong>JarvisDaily</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '5px' }}>
            Daily viral content delivered to your WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}

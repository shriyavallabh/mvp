'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface DashboardClientProps {
  phone: string
  userName: string
}

interface Content {
  whatsappMessage: string
  whatsappImage: string
  linkedinPost: string
  statusImage: string
  sessionDate: string
}

interface AdvisorData {
  advisor: {
    id: string
    name: string
    branding: {
      primaryColor: string
      secondaryColor: string
      tagline: string
    }
  }
  content: Content
}

export default function DashboardClient({ phone, userName }: DashboardClientProps) {
  const [data, setData] = useState<AdvisorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch(`/api/dashboard?phone=${phone}`)
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load content')
        }
        
        setData(result)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    if (phone) {
      loadContent()
    } else {
      setError('No phone number found in your profile')
      setLoading(false)
    }
  }, [phone])

  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} copied!`)
    })
  }

  const extractFirstMessage = (fullText: string): string => {
    const lines = fullText.split('\n')
    let message = ''
    let capturing = false
    
    for (const line of lines) {
      if (line.includes('Message 1') || line.includes('simple_update')) {
        capturing = true
        continue
      }
      if (capturing) {
        if (line.includes('Message 2') || line.includes('---')) {
          break
        }
        if (line.trim() && !line.includes('chars:') && !line.startsWith('----')) {
          message += line + '\n'
        }
      }
    }
    
    return message.trim() || fullText.substring(0, 300)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading your content...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>Content Not Available</h2>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { advisor, content } = data

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 20px 30px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            Hello, {userName}! 👋
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.95, marginBottom: '20px' }}>
            Your daily viral content is ready
          </p>
          <div style={{ marginTop: '15px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              padding: '8px 20px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'inline-block'
            }}>
              {content.sessionDate === 'latest' ? 'Latest' : new Date(content.sessionDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div style={{
          background: '#f5f7fa',
          borderRadius: '30px 30px 0 0',
          marginTop: '-20px',
          padding: '30px 20px',
          minHeight: '80vh'
        }}>
          {content.whatsappMessage && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #f0f0f0',
                background: 'linear-gradient(to right, #f8f9fa, white)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2d3748' }}>
                  📱 WhatsApp Message
                </h2>
              </div>
              <div style={{ padding: '25px' }}>
                {content.whatsappImage && (
                  <div style={{ marginBottom: '20px' }}>
                    <img
                      src={content.whatsappImage}
                      alt="WhatsApp"
                      style={{
                        width: '100%',
                        borderRadius: '15px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                        border: '3px solid #f0f0f0'
                      }}
                    />
                  </div>
                )}
                <div style={{
                  background: '#f8f9fa',
                  borderLeft: '4px solid #667eea',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#2d3748',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {extractFirstMessage(content.whatsappMessage)}
                </div>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '15px', textAlign: 'right' }}>
                  {extractFirstMessage(content.whatsappMessage).length} characters
                </div>
                <button
                  onClick={() => copyText(extractFirstMessage(content.whatsappMessage), 'WhatsApp message')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  📋 Copy Message
                </button>
              </div>
            </div>
          )}

          {content.linkedinPost && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #f0f0f0',
                background: 'linear-gradient(to right, #f8f9fa, white)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2d3748' }}>
                  💼 LinkedIn Post
                </h2>
              </div>
              <div style={{ padding: '25px' }}>
                <div style={{
                  background: '#f8f9fa',
                  borderLeft: '4px solid #667eea',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#2d3748',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {content.linkedinPost}
                </div>
                <div style={{ fontSize: '13px', color: '#718096', marginBottom: '15px', textAlign: 'right' }}>
                  {content.linkedinPost.length} characters
                </div>
                <button
                  onClick={() => copyText(content.linkedinPost, 'LinkedIn post')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  📋 Copy Post
                </button>
              </div>
            </div>
          )}

          {content.statusImage && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #f0f0f0',
                background: 'linear-gradient(to right, #f8f9fa, white)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2d3748' }}>
                  📸 WhatsApp Status
                </h2>
              </div>
              <div style={{ padding: '25px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img
                    src={content.statusImage}
                    alt="Status"
                    style={{
                      width: '100%',
                      borderRadius: '15px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      border: '3px solid #f0f0f0'
                    }}
                  />
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '10px', fontWeight: 600 }}>
                    1080 × 1920 (9:16)
                  </div>
                </div>
                <a href={content.statusImage} download="jarvisdaily-status.png" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    ⬇️ Download Status Image
                  </button>
                </a>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '14px' }}>Powered by <strong>JarvisDaily</strong></p>
            <p style={{ fontSize: '12px', marginTop: '5px' }}>Grammy-Level Viral Content for Financial Advisors</p>
          </div>
        </div>
      </div>
    </div>
  )
}

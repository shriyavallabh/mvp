import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const advisors = [
  { name: 'Shruti Petkar', phone: '919673758777', arn: 'ARN_SHRUTI_001' },
  { name: 'Vidyadhar Petkar', phone: '918975758513', arn: 'ARN_VIDYADHAR_002' },
  { name: 'Shriya Vallabh Petkar', phone: '919765071249', arn: 'ARN_SHRIYA_003' },
  { name: 'Mr. Tranquil Veda', phone: '919022810769', arn: 'ADV_004' }
]

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '792411637295195'
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'finadvise-webhook-2024'
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '1991d7e325d42daef6bc5d6720508ea3'

function findAdvisorByPhone(phone: string) {
  return advisors.find(advisor => {
    const cleanPhone = (p: string) => p.replace(/[+\s-]/g, '')
    const inputClean = cleanPhone(phone)
    const advisorClean = cleanPhone(advisor.phone)
    return advisorClean.endsWith(inputClean.slice(-10)) || inputClean.endsWith(advisorClean.slice(-10))
  })
}

async function sendUtilityTemplateWithButton(advisor: any) {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: advisor.phone,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `Hello ${advisor.name}! Your daily financial content is ready. This includes market insights, LinkedIn post, and WhatsApp status images tailored for you.`
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "retrieve_content",
                  title: "Retrieve Content"
                }
              }
            ]
          }
        }
      })
    })
    const result = await response.json()
    console.log('📨 Utility template sent:', result.messages ? 'Success' : 'Failed', result)
    return result
  } catch (error: any) {
    console.log('❌ Error sending utility template:', error.message)
    throw error
  }
}

function loadAdvisorContent(advisor: any) {
  try {
    const outputDir = path.join(process.cwd(), 'output')
    if (!fs.existsSync(outputDir)) {
      throw new Error('No output directory found')
    }

    const sessions = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('session_'))
      .sort()
      .reverse()

    if (sessions.length === 0) {
      throw new Error('No sessions found')
    }

    const sessionPath = path.join(outputDir, sessions[0])
    const nameParts = advisor.name.toLowerCase().split(' ')
    const advisorSlug = nameParts.join('_')

    let whatsappContent = null
    const whatsappDir = path.join(sessionPath, 'whatsapp/text')
    if (fs.existsSync(whatsappDir)) {
      const whatsappFiles = fs.readdirSync(whatsappDir)
        .filter(f => f.includes(advisorSlug) && f.includes('msg_1') && f.endsWith('.txt'))
      if (whatsappFiles.length > 0) {
        whatsappContent = fs.readFileSync(path.join(whatsappDir, whatsappFiles[0]), 'utf8')
      }
    }

    let linkedinContent = null
    const linkedinDir = path.join(sessionPath, 'linkedin/text')
    if (fs.existsSync(linkedinDir)) {
      const linkedinFiles = fs.readdirSync(linkedinDir)
        .filter(f => f.includes(advisorSlug) && f.includes('post_1') && f.endsWith('.txt'))
      if (linkedinFiles.length > 0) {
        linkedinContent = fs.readFileSync(path.join(linkedinDir, linkedinFiles[0]), 'utf8')
      }
    }

    let imagePath = null
    const imagesDir = path.join(sessionPath, 'images/status/compliant')
    if (fs.existsSync(imagesDir)) {
      const imageFiles = fs.readdirSync(imagesDir)
        .filter(f => f.includes(advisorSlug) && f.includes('status_1') && f.endsWith('.png'))
      if (imageFiles.length > 0) {
        imagePath = path.join(imagesDir, imageFiles[0])
      }
    }

    return { whatsappContent, linkedinContent, imagePath, sessionId: sessions[0] }
  } catch (error: any) {
    console.log('⚠️ Error loading content:', error.message)
    return null
  }
}

async function sendContentPackage(advisor: any) {
  console.log('🎯 sendContentPackage called for:', advisor.name)
  
  const content = loadAdvisorContent(advisor)
  const appSecretProof = crypto
    .createHmac('sha256', APP_SECRET)
    .update(ACCESS_TOKEN!)
    .digest('hex')

  const messages: any[] = []

  if (content?.whatsappContent) {
    messages.push({
      type: "whatsapp_message",
      content: `📱 WhatsApp Message (ready to forward):\n\n${content.whatsappContent}`
    })
  }

  if (content?.linkedinContent) {
    messages.push({
      type: "linkedin_post",
      content: `💼 LinkedIn Post (copy-paste ready):\n\n${content.linkedinContent}`
    })
  }

  if (content?.imagePath) {
    messages.push({
      type: "status_image_info",
      content: `📸 WhatsApp Status Image:\n\nYour branded status image is ready!\n\n📁 Session: ${content.sessionId}\n💾 Download from dashboard or contact admin for delivery.\n\n✅ All content generated with Grammy-level virality standards.`
    })
  }

  if (messages.length === 0) {
    messages.push({
      type: "notification",
      content: `Hi ${advisor.name},\n\nYour content is being prepared. Please contact the admin for delivery.\n\n📧 Support: jarvisdaily.com`
    })
  }

  console.log('🚀 Sending content package to', advisor.name)
  console.log(`📦 Messages to send: ${messages.length}`)

  for (const message of messages) {
    try {
      const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages?access_token=${ACCESS_TOKEN}&appsecret_proof=${appSecretProof}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: advisor.phone,
          type: "text",
          text: { body: message.content }
        })
      })

      const result = await response.json()
      console.log(`✅ ${message.type} sent:`, result.messages ? 'Success' : 'Failed')
      if (!result.messages) {
        console.log('Response:', JSON.stringify(result, null, 2))
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error: any) {
      console.log(`❌ Error sending ${message.type}:`, error.message)
    }
  }

  console.log(`📦 Content package delivered to ${advisor.name}!`)
}

export async function GET(request: NextRequest) {
  console.log('🎯 Webhook GET request received at /api/webhook')

  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('🔍 Webhook verification:', { mode, token, challenge })
  console.log('📌 Expected token:', WEBHOOK_VERIFY_TOKEN)
  console.log('📌 Token match:', token === WEBHOOK_VERIFY_TOKEN)

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!')
    return new NextResponse(challenge, { status: 200 })
  } else {
    console.log('❌ Webhook verification failed')
    console.log('❌ Mode check:', mode === 'subscribe')
    console.log('❌ Token check:', token === WEBHOOK_VERIFY_TOKEN)
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  console.log('📱 POST received at webhook')

  try {
    const signature = request.headers.get('x-hub-signature-256')
    const body = await request.json()

    console.log('📱 Request body:', JSON.stringify(body, null, 2))

    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(JSON.stringify(body))
        .digest('hex')

      const isValid = `sha256=${expectedSignature}` === signature
      console.log('🔐 Signature validation:', isValid ? '✅ Valid' : '❌ Invalid')
    } else {
      console.log('⚠️ No signature header found')
    }

    const { entry } = body

    if (!entry) {
      console.log('⚠️ No entry field in webhook data')
      return NextResponse.json({ success: true, note: 'no entry' })
    }

    if (entry && entry[0] && entry[0].changes) {
      for (const change of entry[0].changes) {
        console.log('🔍 Processing change:', JSON.stringify(change, null, 2))
        const value = change.value

        if (value.statuses) {
          console.log('📊 Status update received:', JSON.stringify(value.statuses, null, 2))
          continue
        }

        if (value.messages) {
          for (const message of value.messages) {
            const fromPhone = message.from
            const advisor = findAdvisorByPhone(fromPhone)

            if (!advisor) {
              console.log(`❌ Unknown phone: ${fromPhone}`)
              continue
            }

            console.log(`📱 Message from: ${advisor.name} (${fromPhone})`)
            console.log(`📝 Message type: ${message.type}`)
            console.log(`📝 Full message object:`, JSON.stringify(message, null, 2))

            const isButtonClick =
              (message.type === 'interactive' && message.interactive?.button_reply?.id === 'retrieve_content') ||
              (message.type === 'button' && message.button?.payload === 'retrieve_content') ||
              (message.button?.text === 'Retrieve Content')

            if (isButtonClick) {
              console.log('🔘 BUTTON CLICKED - Sending content!')
              await sendContentPackage(advisor)
            } else if (message.type === 'text') {
              const text = message.text?.body || ''
              console.log('💬 Text message:', text)
              if (text.toLowerCase().includes('content') || text.toLowerCase().includes('retrieve')) {
                console.log('💬 Text trigger detected - sending content!')
                await sendContentPackage(advisor)
              }
            } else {
              console.log('⚠️ Message type not handled:', message.type)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.log('❌ Webhook error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

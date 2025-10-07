import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

async function getLatestSession(advisorId: string) {
  const outputDir = path.join(process.cwd(), 'output')
  try {
    const sessions = await fs.readdir(outputDir)
    const sessionDirs = sessions.filter(s => s.startsWith('session_')).sort().reverse()
    for (const sessionDir of sessionDirs) {
      const advisorDir = path.join(outputDir, sessionDir, 'advisors', advisorId)
      try {
        await fs.access(advisorDir)
        return path.join(outputDir, sessionDir)
      } catch (e) { continue }
    }
    return null
  } catch (e) { return null }
}

async function getAdvisorContent(advisorId: string) {
  const sessionPath = await getLatestSession(advisorId)
  if (!sessionPath) return null
  const advisorPath = path.join(sessionPath, 'advisors', advisorId)
  try {
    let whatsappMessage = '', linkedinPost = '', whatsappImage = '', statusImage = ''
    const files = await fs.readdir(advisorPath)
    const waFile = files.find(f => f.includes('whatsapp') && f.endsWith('.txt'))
    if (waFile) whatsappMessage = await fs.readFile(path.join(advisorPath, waFile), 'utf-8')
    const liFile = files.find(f => f.includes('linkedin') && f.endsWith('.txt'))
    if (liFile) linkedinPost = await fs.readFile(path.join(advisorPath, liFile), 'utf-8')
    const waImg = files.find(f => f.includes('whatsapp') && (f.endsWith('.png') || f.endsWith('.jpg')))
    if (waImg) whatsappImage = `/api/image?session=${path.basename(sessionPath)}&advisor=${advisorId}&file=${waImg}`
    const stImg = files.find(f => f.includes('status') && (f.endsWith('.png') || f.endsWith('.jpg')))
    if (stImg) statusImage = `/api/image?session=${path.basename(sessionPath)}&advisor=${advisorId}&file=${stImg}`
    return {
      whatsappMessage, whatsappImage, linkedinPost, statusImage,
      sessionDate: path.basename(sessionPath).replace('session_', '')
    }
  } catch (e) {
    console.error('Error reading content:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  try {
    const advisorsPath = path.join(process.cwd(), 'data', 'advisors.json')
    const advisors = JSON.parse(await fs.readFile(advisorsPath, 'utf-8'))
    const advisor = advisors.find((a: any) => 
      a.phone === phone || a.phone === `91${phone}` || `91${a.phone}` === phone
    )
    if (!advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    const content = await getAdvisorContent(advisor.id)
    if (!content) return NextResponse.json({ error: 'No content available' }, { status: 404 })
    return NextResponse.json({
      advisor: { id: advisor.id, name: advisor.name, branding: advisor.branding },
      content
    })
  } catch (e) {
    console.error('Dashboard error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

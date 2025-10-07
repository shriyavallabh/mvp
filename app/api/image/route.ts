import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const session = searchParams.get('session')
  const advisor = searchParams.get('advisor')
  const file = searchParams.get('file')

  if (!session || !advisor || !file) {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  try {
    const imagePath = path.join(
      process.cwd(),
      'output',
      session,
      'advisors',
      advisor,
      file
    )

    if (!fs.existsSync(imagePath)) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const imageBuffer = fs.readFileSync(imagePath)
    const ext = path.extname(file).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    console.error('Image serving error:', e)
    return new NextResponse('Server error', { status: 500 })
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) || 'not set',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('BLOB'))
  })
}
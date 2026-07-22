import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, turnstile_token } = body

    const res = await axios.post(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/auth/login/`, {
      email,
      password,
      turnstile_token,
      client_type: 'b2b'
    })

    const data = res.data

    if (res.status === 200 && data && data.totp_required) {
      return NextResponse.json({
        totp_required: true,
        temp_token: data.temp_token
      })
    }

    if (res.status === 200 && data && (data.access || data.token)) {
      return NextResponse.json({
        success: true,
        access: data.access || data.token,
        refresh: data.refresh,
        user: data.user
      })
    }

    return NextResponse.json({ error: 'Invalid response from server' }, { status: 400 })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string; detail?: string }; status?: number }; message?: string };
    console.error('Pre-login error:', err.response?.data || err.message)
    return NextResponse.json(
      { error: err.response?.data?.error || err.response?.data?.detail || 'Authentication failed' },
      { status: err.response?.status || 500 }
    )
  }
}

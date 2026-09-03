import { NextResponse } from 'next/server';

const AI_MICROSERVICE_URL = process.env.NEXT_PUBLIC_AI_MICROSERVICE_URL
  ? `${process.env.NEXT_PUBLIC_AI_MICROSERVICE_URL}/health`
  : 'http://localhost:8000/api/v1/health';

const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'celebration_ai_secret_key_2026';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(AI_MICROSERVICE_URL, {
      method: 'GET',
      headers: {
        'Authorization': process.env.NEXT_PUBLIC_AI_BEARER_TOKEN || '',
        'X-API-Key': SERVICE_API_KEY,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ status: 'unreachable' }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'unreachable' }, { status: 503 });
  }
}

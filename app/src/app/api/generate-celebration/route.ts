import { NextResponse } from 'next/server';

const AI_MICROSERVICE_URL = process.env.NEXT_PUBLIC_AI_MICROSERVICE_URL 
  ? `${process.env.NEXT_PUBLIC_AI_MICROSERVICE_URL}/generate-celebration`
  : 'http://localhost:8000/api/v1/generate-celebration';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'celebration_ai_secret_key_2026';
const JWT_TOKEN = process.env.NEXT_PUBLIC_AI_BEARER_TOKEN || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, variant_index = 1, previous_messages = [] } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt', message: 'Please provide a valid prompt describing the celebration.' },
        { status: 400 }
      );
    }

    const response = await fetch(AI_MICROSERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERVICE_API_KEY,
        'Authorization': JWT_TOKEN,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        variant_index: Number(variant_index) || 1,
        previous_messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.detail?.error || 'AI Generation Failed',
          message: data?.detail?.message || data?.detail?.reason || 'Failed to generate celebration.',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying to AI Microservice:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Service Unavailable',
        message: 'Could not connect to AI microservice. Make sure celebration_By_AI Python service is running.',
      },
      { status: 503 }
    );
  }
}

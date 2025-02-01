import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Edge runtime for better performance

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not set on the server' },
      { status: 500 }
    );
  }

  try {
    // Extract FormData from the request
    const formData = await req.formData();
    const file = formData.get('file');
    const model = formData.get('model') || 'whisper-1';

    if (!file || !((file as any) instanceof Blob || (file as any) instanceof File)) {
      return NextResponse.json(
        { error: 'A valid file is required for transcription' },
        { status: 400 }
      );
    }


    // Append additional data if necessary
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities', JSON.stringify(['segment']));
    // Send the request to the OpenAI API
    const openAiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData, // Let fetch handle the Content-Type
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      throw new Error(`OpenAI API error: ${openAiResponse.status} - ${errorText}`);
    }

    const data = await openAiResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error with OpenAI API:', error.message || error);
    return NextResponse.json(
      { error: 'Error communicating with OpenAI' },
      { status: 500 }
    );
  }
}

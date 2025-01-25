import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request Body:', body);

    const response = await fetch(`https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT}/runsync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RUNPOD_APIKEY}`, // Add your token here
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Log the error response
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error during processing:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

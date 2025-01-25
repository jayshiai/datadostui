export const sendAudioToOpenAI = async (file: File) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Use a public environment variable
  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");

  try {
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Transcription result:", result);
    return result; // Handle the transcription result as needed
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};

export const sendImageToApi = async (base64Image: string) => {
  try {
    const response = await fetch("/api/runpod", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          type: "image",
          image: base64Image,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending image to API:", error);
    throw error;
  }
};

export const sendTextToApi = async (text: string) => {
  try {
    const response = await fetch("/api/runpod", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          type: "text",
          text,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending text to API:", error);
    throw error;
  }
};

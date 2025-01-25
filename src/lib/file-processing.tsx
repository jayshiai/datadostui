export const sendAudioToOpenAI = async (file: File) => {
  try {
    const formdata = new FormData();
    formdata.append("file", file);
    formdata.append("model", "whisper-1");
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formdata,
    });

    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Transcription result:", data);
    return data;
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

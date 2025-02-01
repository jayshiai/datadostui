"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { sendTextToApi } from "@/lib/file-processing";
import { get } from "http";

interface SpeechRecognitionComponentProps {
  setProcessing: (processing: boolean) => void;
  setFileInfo: (info: any) => void;
  setTextResult: (result: any) => void;
  setTranscriptGlobal: (transcript: string) => void;
}

const SpeechRecognitionComponent: React.FC<SpeechRecognitionComponentProps> = ({
  setProcessing,
  setFileInfo,
  setTextResult,
  setTranscriptGlobal,
}) => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    // setTranscript("");
    // setTextResult(null);
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      setTranscript(finalTranscript.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setProcessing(true);
    setFileInfo({
      name: "Live Audio",
      type: "Speech",
    });
    setIsListening(true);
    console.log("Listening...");
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      console.log("Stopped listening.");
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setTranscriptGlobal(transcript);
    setIsListening(false);
    const getTextResult = async () => {
      try {
        const response = await sendTextToApi(transcript, "en");
        setTextResult(response.output);
        setProcessing(false);
      } catch (error) {
        console.error("Error sending text to API:", error);
      }
    };

    if (transcript.length > 0) {
      getTextResult();
    } else {
      setProcessing(false);
    }
    console.log("Transcript:", transcript);
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={isListening ? stopListening : startListening}
        className={`py-2 rounded-lg  ${isListening ? "bg-red-500" : ""}`}
      >
        {isListening ? "Stop Listening" : "Start Listening"}
      </Button>
    </div>
  );
};

export default SpeechRecognitionComponent;

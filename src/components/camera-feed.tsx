"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { sendImageToApi } from "@/lib/file-processing";
import { get } from "http";

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  setFileInfo: (fileInfo: { name: string; type: string } | null) => void;

  setImageResult: (result: any) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  setFileInfo,
  setImageResult,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    if (isClient && isCameraOn) {
      startCamera();
      startAutoCapture();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopAutoCapture();
    };
  }, [isClient, isCameraOn]);

  const toggleCamera = () => {
    if (isCameraOn && streamRef.current) {
      setFileInfo(null);
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
      stopAutoCapture();
    } else {
      setFileInfo({
        name: "Camera Feed",
        type: "Camera",
      });
      setIsCameraOn(true);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas
          .toDataURL("image/png")
          .replace(/^data:image\/png;base64,/, ""); // Remove prefix
        // console.log(base64Image); // Replace with your logic (e.g., save or use the image)
        console.log("Captured frame.");
        const getImageResults = async (base64Image: string) => {
          try {
            const response = await sendImageToApi(base64Image);
            setImageResult(response.output);
          } catch (error) {
            console.error("Error sending image to API:", error);
          }
        };
        getImageResults(base64Image);
      }
    }
  };

  const startAutoCapture = () => {
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, 5000);
  };

  const stopAutoCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center">
      <Button onClick={toggleCamera} className={isCameraOn ? "bg-red-500" : ""}>
        {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
      </Button>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
};

export default CameraFeed;

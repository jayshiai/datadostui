"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import * as ort from "onnxruntime-web";

const FaceDetection = () => {
  const [isClient, setIsClient] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Canvas to draw bounding boxes
  const streamRef = useRef<MediaStream | null>(null);
  const [model, setModel] = useState<ort.InferenceSession | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Load the ONNX model
    const loadModel = async () => {
      try {
        const session = await ort.InferenceSession.create("/models/yolo.onnx");
        setModel(session);
      } catch (error) {
        console.error("Error loading ONNX model:", error);
      }
    };

    loadModel();

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
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isClient, isCameraOn]);

  const detectFaces = async (canvas: HTMLCanvasElement) => {
    if (!model || !canvasRef.current || !videoRef.current) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Ensure canvas dimensions match the video feed dimensions
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    // Resize the video frame to 640x640
    const targetWidth = 640;
    const targetHeight = 640;

    // Set the canvas size to 640x640
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw resized video frame onto canvas
    context.drawImage(
      videoRef.current,
      0,
      0,
      videoWidth,
      videoHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Convert the image to tensor and prepare input for ONNX model
    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
    const inputArray = new Float32Array(targetWidth * targetHeight * 3);

    // Convert RGBA to RGB and normalize the image data
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      const idx = i * 4;
      inputArray[i * 3] = imageData.data[idx] / 255.0; // R
      inputArray[i * 3 + 1] = imageData.data[idx + 1] / 255.0; // G
      inputArray[i * 3 + 2] = imageData.data[idx + 2] / 255.0; // B
    }

    // Create the input tensor for the model
    const inputTensor = new ort.Tensor("float32", inputArray, [
      1,
      3,
      targetHeight,
      targetWidth,
    ]);

    try {
      // Run inference
      const results = await model.run({ input: inputTensor });

      // Debug the results to check the available output keys
      console.log("Inference Results:", results);

      // Check the available output keys and handle them correctly
      const outputKey = Object.keys(results)[0]; // Get the first key (it should be the face detection output)
      const output = results[outputKey]?.data;

      if (!output) {
        console.error("Output is undefined or has no data");
        return;
      }

      // Process the results (bounding boxes and confidences)
      drawBoundingBoxes(output, context);
    } catch (error) {
      console.error("Error during inference:", error);
    }
  };

  const drawBoundingBoxes = (
    results: any,
    context: CanvasRenderingContext2D
  ) => {
    // Assuming results is an array with each element being a bounding box
    for (let i = 0; i < results.length; i++) {
      const [x, y, width, height, confidence] = results[i];

      if (confidence > 0.9) {
        context.beginPath();
        context.rect(x, y, width, height);
        context.lineWidth = 2;
        context.strokeStyle = "green";
        context.fillStyle = "green";
        context.stroke();
        context.fillText(`${confidence.toFixed(2)}`, x, y);
      }
    }
  };

  const toggleCamera = () => {
    if (isCameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    } else {
      setIsCameraOn(true);
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Camera Feed</h1>
      <video
        ref={videoRef}
        className="border-2 border-gray-300 rounded-lg shadow-lg"
        style={{ width: "100%", maxWidth: "640px", height: "auto" }}
        autoPlay
        playsInline
        muted
        onPlay={() => {
          if (videoRef.current && canvasRef.current) {
            // Match canvas size with video
            canvasRef.current.width = 640;
            canvasRef.current.height = 640;
            detectFaces(canvasRef.current); // Detect faces using the canvas
          }
        }}
      />
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg shadow-lg"
        style={{
          width: "100%",
          maxWidth: "640px",
          height: "auto",
          display: "block", // Change from display: "none"
        }}
      />
      <Button onClick={toggleCamera}>
        {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
      </Button>
    </div>
  );
};

export default FaceDetection;

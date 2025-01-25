"use client";
import { CircleXIcon } from "lucide-react";
import React, { useState, useRef } from "react";
import {
  sendAudioToOpenAI,
  sendImageToApi,
  sendTextToApi,
} from "@/lib/file-processing";
import ImageResult from "@/components/image-result";
import TextResult from "@/components/text-result";
import CameraFeed from "@/components/camera-feed";
import SpeechRecognitionComponent from "@/components/record";
export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fileInfo, setFileInfo] = useState<ProcessedFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textResult, setTextResult] = useState<
    { label: string; score: number }[] | null
  >(null);
  const [imageResult, setImageResult] = useState<
    { label: string; score: number }[] | null
  >(null);

  interface ProcessedFile {
    name: string;
    type?: string;
    size?: number;
    previewUrl?: string;
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File): void => {
    const fileType: string = file.type;
    const fileName: string = file.name.toLowerCase();
    let fileCategory: string;

    if (fileType.startsWith("audio/") || fileName.includes("audio")) {
      fileCategory = "Audio";
    } else if (fileType.startsWith("image/")) {
      fileCategory = "Image";
    } else if (fileType.startsWith("video/")) {
      fileCategory = "Video";
    } else if (fileName.endsWith(".mpeg") && fileName.includes("audio")) {
      fileCategory = "Audio"; // Explicitly check for `.mpeg` with "audio" in the name
    } else {
      fileCategory = "Unknown";
    }
    const processedFile: ProcessedFile = {
      name: file.name,
      type: fileCategory,
      size: file.size,
      previewUrl: URL.createObjectURL(file), // Generate preview URL
    };
    setProcessing(true);
    setFileInfo(processedFile);

    if (fileCategory === "Audio") {
      // sendAudioToOpenAI(file)
      //   .then((result) => {
      //     setProcessing(false);
      //     setTranscript(result.text);

      //   })
      //   .catch((error) => {
      //     console.error("Error transcribing audio:", error);
      //   });
      //rewrite above as async/await

      const transcribeAudio = async (file: File) => {
        try {
          const result = await sendAudioToOpenAI(file);
          setProcessing(false);
          setTranscript(result.text);
          const textResult = await sendTextToApi(result.text);
          // const mytext2 =
          //   "sir we are talking from bank, open given link to get your account details";
          // const mytext =
          //   "Hello, this is Alice calling from the Underwriting Department regarding your Discover credit card account. Based on your recent payment activity and balance, you are eligible for an interest rate reduction to as low as 1.9%. To take advantage of this limited time offer, please call Card Member Services directly at 1-800-694-0048. Once again, that's 1-800-694-0048. This will be the only notice you receive, and this offer is only valid for three business days. Thank you. Hello, this is Elizabeth calling from the Underwriting Department regarding your Capital One credit card account. Based on your recent payment activity and balance, you may be eligible for an interest rate reduction to as low as 1.9%. There is additional information I need to confirm your eligibility, so please return my call directly in the Underwriting Department at 1-800-258-6019, and once again, 1-800-258-6019. This will be the only notice you receive, and this offer is only valid for three business days.";
          // setTranscript(mytext2);
          // const textResult = await sendTextToApi(mytext2);
          setTextResult(textResult.output);
          console.log("Text result:", textResult);
        } catch (error) {
          console.error("Error transcribing audio:", error);
        }
      };

      transcribeAudio(file);
    }

    if (fileCategory === "Video") {
      const video = document.createElement("video");
      video.src = processedFile.previewUrl!;
      video.crossOrigin = "anonymous";

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const frameCount = 10; // Number of frames to extract
        const interval = duration / frameCount;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        const frames: string[] = [];

        const captureFrame = (time: number): Promise<string> =>
          new Promise((resolve) => {
            video.currentTime = time;
            video.onseeked = () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64Image = canvas.toDataURL("image/jpeg");
              resolve(base64Image);
            };
          });

        const calculateAverageResult = (
          results: any[]
        ): { label: string; score: number }[] => {
          const totalScores = results.reduce(
            (acc, result) => {
              const realScore =
                result.output.find((o: any) => o.label === "Real")?.score || 0;
              const fakeScore =
                result.output.find((o: any) => o.label === "Fake")?.score || 0;

              acc.real += realScore;
              acc.fake += fakeScore;
              return acc;
            },
            { real: 0, fake: 0 }
          );

          const count = results.length;

          // Compute average scores
          const averagedScores = [
            { label: "Real", score: totalScores.real / count },
            { label: "Fake", score: totalScores.fake / count },
          ];

          // Ensure the first element has a higher score
          return averagedScores.sort((a, b) => b.score - a.score);
        };

        (async () => {
          for (let i = 0; i < frameCount; i++) {
            const frameTime = interval * i;
            const frame = await captureFrame(frameTime);
            frames.push(frame.replace(/^data:image\/[a-zA-Z]+;base64,/, ""));
          }

          // Send all frames to the API
          Promise.all(frames.map((frame) => sendImageToApi(frame)))
            .then((results) => {
              const averagedResult = calculateAverageResult(results);
              console.log("Frame results:", averagedResult);
              setProcessing(false);
              setImageResult(averagedResult);
            })
            .catch((error) => {
              console.error("Error processing frames:", error);
              setProcessing(false);
            });
        })();
      };

      video.onerror = () => {
        console.error("Error loading video file.");
        setProcessing(false);
      };
    }
    if (fileCategory === "Image") {
      // Convert file to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64ImageWithPrefix = reader.result as string;

        // Remove the prefix (e.g., `data:image/jpeg;base64,`)
        const base64Image = base64ImageWithPrefix.replace(
          /^data:image\/[a-zA-Z]+;base64,/,
          ""
        );

        sendImageToApi(base64Image)
          .then((result) => {
            console.log("API response:", result);
            setProcessing(false);
            setImageResult(result.output);
          })
          .catch((error) => {
            console.error("Error sending image to API:", error);
          });
      };
      reader.onerror = () => {
        console.error("Error reading file for Base64 conversion.");
      };
      reader.readAsDataURL(file); // Convert file to Base64
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-2.5rem)]">
      {/* Drag and Drop Region */}
      <div
        className="border-r-2 w-full h-1/2 md:h-full md:w-2/5 flex items-center justify-center relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!fileInfo ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col h-full w-full items-center justify-center border-2 border-dashed p-4 rounded-lg cursor-pointer hover:bg-black"
          >
            <p className="opacity-70">Drop your file here or click to upload</p>
            <input
              id="file-upload"
              type="file"
              accept="audio/*,image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <>
            <CircleXIcon
              className="absolute top-2 right-2 z-50 cursor-pointer"
              onClick={() => setFileInfo(null)}
            />

            {fileInfo.type === "Image" ? (
              <img
                src={fileInfo.previewUrl}
                alt={fileInfo.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : fileInfo.type === "Video" ? (
              <video
                controls
                src={fileInfo.previewUrl}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : fileInfo.type === "Audio" ? (
              <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white">
                <p className="mb-4">{fileInfo.name}</p>
                <audio controls src={fileInfo.previewUrl} className="w-3/4" />
              </div>
            ) : fileInfo.type == "Camera" ? (
              <video
                ref={videoRef}
                className="border-2 shadow-lg "
                style={{ width: "100%", height: "auto" }}
                autoPlay
                playsInline
                muted
              />
            ) : (
              <p className="text-red-500">Unsupported file type</p>
            )}
          </>
        )}
      </div>

      {/* File Info or Preview */}
      <div className="h-full w-full md:w-3/5 ">
        <div className=" h-3/5 md:h-4/5 w-full">
          {fileInfo ? (
            processing ? (
              <div className="h-full w-full flex items-center justify-center">
                Processing...
              </div>
            ) : fileInfo.type == "Video" ? (
              <div>
                {imageResult ? (
                  <ImageResult result={imageResult} />
                ) : (
                  "No result available"
                )}
              </div>
            ) : fileInfo.type === "Audio" ? (
              <div className="h-full w-full">
                <div className="h-1/2 2-full">
                  {textResult ? (
                    <TextResult result={textResult} />
                  ) : (
                    "No result available"
                  )}
                </div>
                <div className="h-1/2 w-full border-t-2 py-2 overflow-y-auto">
                  <div className="text-3xl px-2">Transcript:</div>
                  <div className="text-muted-foreground px-4">{transcript}</div>
                </div>
              </div> // Display the transcript if audio
            ) : fileInfo.type === "Speech" ? (
              <div className="h-full w-full">
                <div className="h-1/2 2-full">
                  {textResult ? (
                    <TextResult result={textResult} />
                  ) : (
                    "No result available"
                  )}
                </div>
                <div className="h-1/2 w-full border-t-2 py-2 overflow-y-auto">
                  <div className="text-3xl px-2">Transcript:</div>
                  <div className="text-muted-foreground px-4">
                    {transcript
                      ? transcript
                      : "No audio recorded. Please try again."}
                  </div>
                </div>
              </div>
            ) : fileInfo.type === "Image" ? (
              <div>
                {imageResult ? (
                  <ImageResult result={imageResult} />
                ) : (
                  "No result available"
                )}
              </div> // Display image result
            ) : fileInfo.type === "Camera" ? (
              <div>
                {imageResult ? (
                  <ImageResult result={imageResult} />
                ) : (
                  "No result available"
                )}
              </div>
            ) : (
              <div>No result available for this file type</div>
            )
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              Drop a file to get started
            </div>
          )}
        </div>
        <div className="h-2/5 md:h-1/5 w-full border-t-2 flex flex-col md:flex-row">
          <div className="md:w-1/2 w-full text-left h-full border-r-2 ">
            <p className="text-xl border-b-2">File Info:</p>
            {fileInfo && (
              <>
                <div className=" pr-4">
                  <p>Name: {fileInfo.name}</p>
                  <p>Type: {fileInfo.type}</p>
                  {fileInfo.size && <p>Size: {fileInfo.size} bytes</p>}
                </div>
              </>
            )}
          </div>
          <div className=" w-full md:w-1/2 flex items-center justify-around py-8">
            <CameraFeed
              setFileInfo={setFileInfo}
              videoRef={videoRef}
              setImageResult={setImageResult}
            />
            <SpeechRecognitionComponent
              setProcessing={setProcessing}
              setFileInfo={setFileInfo}
              setTextResult={setTextResult}
              setTranscriptGlobal={setTranscript}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

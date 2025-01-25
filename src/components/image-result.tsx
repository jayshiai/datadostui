import { cn } from "@/lib/utils";
import React from "react";
export interface ImageResultType {
  label: string;
  score: number;
}
const ImageResult = ({ result }: { result: ImageResultType[] }) => {
  console.log(result);
  return (
    <div className="py-5">
      <div>
        <p className="text-3xl px-2">Conclusion : </p>
        <div
          className={cn(
            "text-9xl font-mono px-4",
            result[0].label == "Real" ? " text-green-600" : "text-red-600"
          )}
        >
          {result[0].label}
        </div>
      </div>
      <div className="border-t-2 py-2">
        <div className="text-3xl px-2">Confidence Scores:</div>
        <div className=" text-lg px-4">
          {result.map((result, index) => (
            <div key={index} className=" text-muted-foreground">
              -- {result.label} ({(result.score * 100).toFixed(2)}%)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageResult;

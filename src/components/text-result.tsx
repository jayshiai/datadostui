import React from "react";
import { cn } from "@/lib/utils";
export interface TextResultType {
  label: string;
  score: number;
}
const TextResult = ({ result }: { result: TextResultType[] }) => {
  return (
    <div className="py-5">
      <div>
        <p className="text-3xl px-2">Conclusion : </p>
        <div
          className={cn(
            "text-9xl font-mono px-4",
            result[0].label == "HAM" ? " text-green-600" : "text-red-600"
          )}
        >
          {result[0].label}
        </div>
      </div>
      <div className="border-t-2 py-2">
        <div className="text-3xl px-2">Confidence Scores:</div>
        <div className="px-4 text-lg">
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

export default TextResult;

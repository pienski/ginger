"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface DirectionStepsProps {
  directions: string[];
}

export default function DirectionSteps({ directions }: DirectionStepsProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    // Don't toggle if the user is selecting text
    if (window.getSelection()?.toString()) return;

    const newChecked = new Set(checkedSteps);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedSteps(newChecked);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-6 border-b border-gray-100 dark:border-zinc-800 pb-2 text-gray-900 dark:text-gray-100">Directions</h3>
      <div className="space-y-6">
        {directions.map((step, index) => {
          const isChecked = checkedSteps.has(index);

          return (
            <div
              key={index}
              onClick={() => toggleStep(index)}
              className={`flex gap-4 cursor-pointer transition-opacity ${
                isChecked ? "opacity-30" : "opacity-100"
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                isChecked 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400" 
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500"
              }`}>
                {index + 1}
              </div>
              <div className={`flex-grow pt-0.5 text-lg leading-relaxed ${
                isChecked ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"
              } markdown-content`}>
                <ReactMarkdown>{step}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

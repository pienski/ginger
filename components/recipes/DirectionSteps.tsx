"use client";

import { useState } from "react";

interface DirectionStepsProps {
  directions: string[];
}

export default function DirectionSteps({ directions }: DirectionStepsProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedSteps(newChecked);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-6 border-b pb-2">Directions</h3>
      <div className="space-y-6">
        {directions.map((step, index) => {
          const isChecked = checkedSteps.has(index);

          return (
            <div
              key={index}
              onClick={() => toggleStep(index)}
              className={`flex gap-4 cursor-pointer select-none transition-opacity ${
                isChecked ? "opacity-40" : "opacity-100"
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                isChecked ? "bg-blue-100 text-blue-500" : "bg-gray-100 text-gray-500"
              }`}>
                {index + 1}
              </div>
              <div className={`flex-grow pt-1 text-lg leading-relaxed ${
                isChecked ? "line-through text-gray-400" : "text-gray-800"
              }`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/db/schema";
import { formatAmount, formatMetricAmount } from "@/lib/utils";

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
}

export default function IngredientList({ ingredients, baseServings }: IngredientListProps) {
  const [selectedServings, setSelectedServings] = useState(baseServings);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Ingredients</h3>
        <div className="flex items-center gap-2 border rounded-md p-1 bg-gray-50">
          <button
            onClick={() => setSelectedServings(Math.max(1, selectedServings - 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm transition-colors"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">
            {selectedServings}
          </span>
          <button
            onClick={() => setSelectedServings(selectedServings + 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm transition-colors"
          >
            +
          </button>
          <span className="text-xs text-gray-500 pr-2">servings</span>
        </div>
      </div>

      <ul className="space-y-3">
        {ingredients.map((ing, index) => {
          const scaledAmount = (ing.amount * selectedServings) / baseServings;
          const scaledMetricAmount = ing.metric_amount 
            ? (ing.metric_amount * selectedServings) / baseServings 
            : null;
          const isChecked = checkedItems.has(index);

          return (
            <li
              key={index}
              onClick={() => toggleItem(index)}
              className={`flex items-start gap-3 cursor-pointer select-none transition-opacity ${
                isChecked ? "opacity-40" : "opacity-100"
              }`}
            >
              <div className={`mt-1.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"
              }`}>
                {isChecked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className={`${isChecked ? "line-through text-gray-500" : "text-gray-800"}`}>
                <span className="font-bold">
                  {formatAmount(scaledAmount)}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </span>
                {scaledMetricAmount !== null && (
                  <span className="text-gray-500 ml-1 text-sm font-medium">
                    ({formatMetricAmount(scaledMetricAmount, ing.metric_unit)})
                  </span>
                )}
                {" "}
                {ing.name}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

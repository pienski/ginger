"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/db/schema";

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
}

const formatAmount = (num: number) => {
  if (num === 0) return "0";
  
  // Fractions for amounts < 1
  if (num < 1) {
    if (Math.abs(num - 0.25) < 0.01) return "¼";
    if (Math.abs(num - 0.5) < 0.01) return "½";
    if (Math.abs(num - 0.75) < 0.01) return "¾";
    if (Math.abs(num - 0.33) < 0.02) return "⅓";
    if (Math.abs(num - 0.66) < 0.02) return "⅔";
  }

  // Round to 2 significant figures
  return Number(num.toPrecision(2)).toString();
};

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
                </span>{" "}
                {ing.name}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

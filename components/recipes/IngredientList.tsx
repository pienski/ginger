"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/db/schema";
import { formatAmount, formatMetricAmount, getPluralizedUnit } from "@/lib/utils";

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
  useIngredientGroups?: boolean;
}

export default function IngredientList({ 
  ingredients, 
  baseServings,
  useIngredientGroups = false,
}: IngredientListProps) {
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

  // Group ingredients if needed
  const groupedIngredients = useIngredientGroups
    ? ingredients.reduce((groups, ing, index) => {
        const groupName = ing.group || "Other";
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push({ ...ing, originalIndex: index });
        return groups;
      }, {} as Record<string, (Ingredient & { originalIndex: number })[]>)
    : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ingredients</h3>
        <div className="flex items-center gap-2 border dark:border-zinc-800 rounded-md p-1 bg-gray-50 dark:bg-zinc-800">
          <button
            onClick={() => setSelectedServings(Math.max(1, selectedServings - 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm transition-colors text-gray-700 dark:text-gray-300"
          >
            -
          </button>
          <span className="w-12 text-center font-medium text-gray-900 dark:text-gray-100">
            {selectedServings}
          </span>
          <button
            onClick={() => setSelectedServings(selectedServings + 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm transition-colors text-gray-700 dark:text-gray-300"
          >
            +
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 pr-2">servings</span>
        </div>
      </div>

      {groupedIngredients ? (
        <div className="space-y-6">
          {Object.entries(groupedIngredients).map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-3">
              <h4 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider border-b dark:border-zinc-800 pb-1">
                {groupName}
              </h4>
              <ul className="space-y-3">
                {groupItems.map((ing) => {
                  const scaledAmount = (ing.amount * selectedServings) / baseServings;
                  const scaledMetricAmount = ing.metric_amount 
                    ? (ing.metric_amount * selectedServings) / baseServings 
                    : null;
                  const isChecked = checkedItems.has(ing.originalIndex);

                  return (
                    <li
                      key={ing.originalIndex}
                      onClick={() => toggleItem(ing.originalIndex)}
                      className={`flex items-start gap-3 cursor-pointer select-none transition-opacity ${
                        isChecked ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <div className={`mt-1.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-zinc-700"
                      }`}>
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className={`${isChecked ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                        {scaledAmount > 0 && (
                          <>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {formatAmount(scaledAmount)}
                              {ing.unit ? ` ${getPluralizedUnit(ing.unit, scaledAmount)}` : ""}
                            </span>
                            {scaledMetricAmount !== null && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm font-medium">
                                ({formatMetricAmount(scaledMetricAmount, ing.metric_unit || null)})
                              </span>
                            )}
                            {" "}
                          </>
                        )}
                        {ing.name}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
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
                  isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-zinc-700"
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`${isChecked ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                  {scaledAmount > 0 && (
                    <>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {formatAmount(scaledAmount)}
                        {ing.unit ? ` ${getPluralizedUnit(ing.unit, scaledAmount)}` : ""}
                      </span>
                      {scaledMetricAmount !== null && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm font-medium">
                          ({formatMetricAmount(scaledMetricAmount, ing.metric_unit || null)})
                        </span>
                      )}
                      {" "}
                    </>
                  )}
                  {ing.name}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

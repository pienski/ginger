// Grocery-list aggregation → Markdown. Pure functions (client- and server-safe).
// Aggregation is intentionally dumb: ingredients are merged only when their name
// (trimmed, case-insensitive) AND unit match exactly — no standardized ingredient
// database, no fuzzy matching. Smart summarization / spice-filtering is a future
// LLM step that can consume aggregateIngredients() output unchanged.

import type { Ingredient } from "@/lib/db/schema";
import { formatDayMonth } from "@/lib/dates";
import { formatIngredientLine, scaleIngredient } from "./recipe";

export interface GroceryMeal {
  title: string;
  baseServings: number;
  servings: number;
  ingredients: Ingredient[];
}

export interface AggregatedItem {
  name: string;
  unit: string | null;
  amount: number;
  metricAmount: number | null;
  metricUnit: "g" | "ml" | null;
}

/**
 * Scale every meal's ingredients to its chosen servings, then merge entries that
 * share a (name, unit) key, summing amounts (and metric amounts) in parallel.
 * Returns items in first-seen order. Different units for the same name stay on
 * separate lines.
 */
export function aggregateIngredients(meals: GroceryMeal[]): AggregatedItem[] {
  const items = new Map<string, AggregatedItem>();
  const order: string[] = [];

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const { amount, metricAmount } = scaleIngredient(ing, meal.servings, meal.baseServings);
      const key = `${ing.name.trim().toLowerCase()}|${(ing.unit ?? "").trim().toLowerCase()}`;
      const existing = items.get(key);

      if (existing) {
        existing.amount += amount;
        if (metricAmount != null) {
          existing.metricAmount = (existing.metricAmount ?? 0) + metricAmount;
        }
      } else {
        items.set(key, {
          name: ing.name.trim(),
          unit: ing.unit ?? null,
          amount,
          metricAmount,
          metricUnit: ing.metric_unit ?? null,
        });
        order.push(key);
      }
    }
  }

  return order.map((key) => items.get(key)!);
}

/** Render an aggregated item as an ingredient line, reusing the recipe formatter. */
function formatAggregatedLine(item: AggregatedItem): string {
  return formatIngredientLine(
    { name: item.name, unit: item.unit, metric_unit: item.metricUnit },
    item.amount,
    item.metricAmount,
  );
}

/** Build the aggregated grocery checklist as copy-pasteable Markdown. */
export function buildGroceryMarkdown(
  meals: GroceryMeal[],
  opts: { from: string; to: string },
): string {
  const items = aggregateIngredients(meals);
  const range =
    opts.from === opts.to
      ? formatDayMonth(opts.from)
      : `${formatDayMonth(opts.from)} – ${formatDayMonth(opts.to)}`;
  const mealLabel = `${meals.length} ${meals.length === 1 ? "meal" : "meals"}`;

  const lines: string[] = ["## Groceries", `*${range} · ${mealLabel}*`, ""];

  if (items.length === 0) {
    lines.push("_No ingredients._");
  } else {
    for (const item of items) lines.push(`- [ ] ${formatAggregatedLine(item)}`);
  }

  return `${lines.join("\n").trim()}\n`;
}

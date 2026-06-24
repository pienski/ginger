// Standardized recipe → Markdown serialization. Pure functions (no "use server",
// no DOM/Node deps) so they run on the server, in client components, and in any
// future export / LLM pipeline. Number formatting mirrors the recipe detail view
// (see components/recipes/IngredientList.tsx) by reusing the same lib/utils helpers.

import type { Ingredient, Recipe } from "@/lib/db/schema";
import { formatAmount, formatMetricAmount, getPluralizedUnit } from "@/lib/utils";

/** Scale one ingredient's amounts from the recipe's base servings to `servings`. */
export function scaleIngredient(
  ing: Ingredient,
  servings: number,
  baseServings: number,
): { amount: number; metricAmount: number | null } {
  const factor = baseServings > 0 ? servings / baseServings : 1;
  return {
    amount: ing.amount * factor,
    metricAmount: ing.metric_amount != null ? ing.metric_amount * factor : null,
  };
}

/**
 * One human-readable ingredient line, e.g. `600 g chicken breast` or
 * `1½ cups (355 ml) milk`. Quantity is omitted entirely when it scales to 0
 * (matches the `scaledAmount > 0` gate in the detail view). The metric value is
 * shown in parentheses only when present and non-zero.
 */
export function formatIngredientLine(
  ing: Pick<Ingredient, "name" | "unit" | "metric_unit">,
  scaledAmount: number,
  scaledMetricAmount: number | null,
): string {
  const parts: string[] = [];

  if (scaledAmount > 0) {
    const unit = ing.unit ? ` ${getPluralizedUnit(ing.unit, scaledAmount)}` : "";
    let quantity = `${formatAmount(scaledAmount)}${unit}`;
    if (scaledMetricAmount && scaledMetricAmount > 0) {
      const metric = formatMetricAmount(scaledMetricAmount, ing.metric_unit ?? null);
      if (metric) quantity += ` (${metric})`;
    }
    parts.push(quantity);
  }

  parts.push(ing.name.trim());
  return parts.join(" ");
}

/**
 * Render a full recipe as Markdown, scaled to `opts.servings` (defaults to the
 * recipe's base servings). Respects ingredient groups, numbers the directions,
 * and includes notes / source when present. Ingredient and direction text is
 * emitted verbatim since it may already contain Markdown.
 */
export function recipeToMarkdown(
  recipe: Recipe,
  opts: { servings?: number } = {},
): string {
  const servings = opts.servings ?? recipe.servings;
  const lines: string[] = [];

  lines.push(`# ${recipe.title}`, "");

  if (recipe.description) {
    lines.push(recipe.description, "");
  }

  lines.push(`**Servings:** ${servings}`, "");

  const renderIngredient = (ing: Ingredient): string => {
    const { amount, metricAmount } = scaleIngredient(ing, servings, recipe.servings);
    return `- ${formatIngredientLine(ing, amount, metricAmount)}`;
  };

  lines.push("## Ingredients", "");
  if (recipe.use_ingredient_groups) {
    // Group while preserving first-seen group order (mirrors the detail view).
    const groups = new Map<string, Ingredient[]>();
    for (const ing of recipe.ingredients) {
      const group = ing.group || "Other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(ing);
    }
    let first = true;
    for (const [group, items] of groups) {
      if (!first) lines.push("");
      first = false;
      lines.push(`**${group}**`);
      for (const ing of items) lines.push(renderIngredient(ing));
    }
  } else {
    for (const ing of recipe.ingredients) lines.push(renderIngredient(ing));
  }
  lines.push("");

  if (recipe.directions.length > 0) {
    lines.push("## Directions", "");
    recipe.directions.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push("");
  }

  if (recipe.notes) {
    lines.push("## Notes", "", recipe.notes, "");
  }

  if (recipe.source_url) {
    lines.push(`Source: ${recipe.source_url}`, "");
  }

  return `${lines.join("\n").trim()}\n`;
}

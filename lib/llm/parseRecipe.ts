import { deepseek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";

const ingredientSchema = z.object({
  name: z
    .string()
    .describe("The name of the ingredient, e.g., 'all-purpose flour'"),
  amount: z
    .number()
    .describe(
      "The numeric quantity, e.g., 1.5. Convert fractions like '1/2' to 0.5.",
    ),
  unit: z
    .string()
    .nullable()
    .describe(
      "The unit of measurement, e.g., 'cups', 'tbsp', 'g'. Use null for countable items like '2 large eggs'.",
    ),
  metric_amount: z
    .number()
    .nullable()
    .optional()
    .describe(
      "If the text provides metric equivalents (like 120g), extract the number here.",
    ),
  metric_unit: z
    .enum(["g", "ml"])
    .nullable()
    .optional()
    .describe(
      "If the text provides metric equivalents, extract the unit ('g' or 'ml').",
    ),
  group: z
    .string()
    .nullable()
    .optional()
    .describe(
      "If the recipe has sections like 'For the cake' and 'For the frosting', put the section name here.",
    ),
});

const recipeSchema = z.object({
  title: z.string().describe("The name of the recipe"),
  description: z
    .string()
    .nullable()
    .describe("A brief summary or intro for the recipe"),
  servings: z
    .number()
    .describe(
      "The number of servings the recipe makes. Default to 2 if not specified.",
    ),
  tags: z
    .array(z.string())
    .describe(
      "A list of relevant tags like 'Dinner', 'Spicy', 'Dessert', 'Quick'",
    ),
  ingredients: z.array(ingredientSchema),
  use_ingredient_groups: z
    .boolean()
    .describe(
      "True if the ingredients are organized into named groups/sections.",
    ),
  directions: z
    .array(z.string())
    .describe("An ordered list of steps to prepare the recipe"),
  notes: z
    .string()
    .nullable()
    .describe("Any extra tips, variations, or substitutions mentioned"),
  source_url: z
    .string()
    .nullable()
    .describe("The original URL if found in the text"),
});

export async function parseRecipe(text: string) {
  const { object } = await generateObject({
    model: deepseek("deepseek-v4-flash"),
    schema: recipeSchema,
    system:
      "You are an expert chef and recipe editor. Extract a structured recipe from the provided text. " +
      "Standardize fraction amounts to decimals (e.g., 1/2 becomes 0.5, 1/4 becomes 0.25). " +
      "If the recipe has distinct sections (e.g., 'For the crust', 'For the filling'), set 'use_ingredient_groups' to true and assign the section name to each ingredient's 'group' field. " +
      "If no sections are found, 'use_ingredient_groups' should be false and 'group' should be null or empty. " +
      "Clean up ingredient names (e.g., '2 cups of sifted flour' -> amount: 2, unit: 'cups', name: 'sifted flour')." +
      "If the text was provided in Polish - keep the output text in Polish. If in English - keep it in English." +
      "NEVER provide any tags",
    prompt: text,
  });

  return object;
}

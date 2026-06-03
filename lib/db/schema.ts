import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export type Ingredient = {
  name: string;
  amount: number;
  unit: string | null;
  metric_amount?: number | null;
  metric_unit?: 'g' | 'ml' | null;
};

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  photo_url: text("photo_url"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  servings: integer("servings").notNull(),
  ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull(),
  directions: jsonb("directions").$type<string[]>().notNull(),
  notes: text("notes"),
  source_url: text("source_url"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const mealHistory = pgTable("meal_history", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  recipe_id: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  cooked_at: timestamp("cooked_at").notNull(),
  notes: text("notes"),
});

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type MealHistory = typeof mealHistory.$inferSelect;
export type NewMealHistory = typeof mealHistory.$inferInsert;

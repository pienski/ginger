"use server";

import { db } from "@/lib/db";
import { recipes, mealHistory, Recipe } from "@/lib/db/schema";
import { desc, asc, eq, sql, and, ilike } from "drizzle-orm";

export type RecipeWithLastCooked = Recipe & { last_cooked_at: Date | null };

export type SortOption = "recently_added" | "recently_cooked" | "alphabetical";

export interface GetRecipesParams {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
  sortBy?: SortOption;
}

export async function getRecipes({
  limit = 15,
  offset = 0,
  search = "",
  tags = [],
  sortBy = "recently_added",
}: GetRecipesParams = {}) {
  const whereConditions = [];

  if (search) {
    whereConditions.push(ilike(recipes.title, `%${search}%`));
  }

  if (tags.length > 0) {
    // Check if the recipe's tags array contains all requested tags
    whereConditions.push(sql`${recipes.tags} @> ${JSON.stringify(tags)}::jsonb`);
  }

  const query = db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      photo_url: recipes.photo_url,
      photo_position: recipes.photo_position,
      tags: recipes.tags,
      servings: recipes.servings,
      ingredients: recipes.ingredients,
      use_ingredient_groups: recipes.use_ingredient_groups,
      directions: recipes.directions,
      notes: recipes.notes,
      source_url: recipes.source_url,
      created_at: recipes.created_at,
      updated_at: recipes.updated_at,
      last_cooked_at: sql<Date | null>`max(${mealHistory.cooked_at})`,
    })
    .from(recipes)
    .leftJoin(mealHistory, eq(recipes.id, mealHistory.recipe_id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(recipes.id);

  if (sortBy === "recently_added") {
    query.orderBy(desc(recipes.created_at));
  } else if (sortBy === "recently_cooked") {
    // Sort by max(cooked_at) descending, with nulls last
    query.orderBy(sql`max(${mealHistory.cooked_at}) DESC NULLS LAST`);
  } else if (sortBy === "alphabetical") {
    query.orderBy(asc(recipes.title));
  }

  const results = await query.limit(limit).offset(offset);

  return results as RecipeWithLastCooked[];
}

export async function getAllTags() {
  const results = await db.execute(
    sql`SELECT DISTINCT jsonb_array_elements_text(${recipes.tags}) as tag FROM ${recipes} ORDER BY tag ASC`
  );
  return results.map((r) => r.tag as string);
}

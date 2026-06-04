import { db } from "@/lib/db";
import { recipes, mealHistory } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import RecipeList from "@/components/recipes/RecipeList";
import AddRecipeDropdown from "@/components/recipes/AddRecipeDropdown";

export default async function RecipesPage() {
  const allRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      photo_url: recipes.photo_url,
      tags: recipes.tags,
      servings: recipes.servings,
      ingredients: recipes.ingredients,
      directions: recipes.directions,
      notes: recipes.notes,
      source_url: recipes.source_url,
      created_at: recipes.created_at,
      updated_at: recipes.updated_at,
      last_cooked_at: sql<Date | null>`max(${mealHistory.cooked_at})`,
    })
    .from(recipes)
    .leftJoin(mealHistory, eq(recipes.id, mealHistory.recipe_id))
    .groupBy(recipes.id)
    .orderBy(desc(recipes.created_at));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <AddRecipeDropdown />
      </div>

      <RecipeList initialRecipes={allRecipes} />
    </div>
  );
}

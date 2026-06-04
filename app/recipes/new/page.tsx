import { Suspense } from "react";
import { db } from "@/lib/db";
import NewRecipeClient from "@/components/recipes/NewRecipeClient";

export default async function NewRecipePage() {
  const allRecipes = await db.query.recipes.findMany({
    columns: {
      tags: true,
    },
  });

  const existingTags = Array.from(
    new Set(allRecipes.flatMap((r) => r.tags as string[])),
  ).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="max-w-4xl mx-auto py-20 text-center text-gray-500">Loading...</div>}>
        <NewRecipeClient existingTags={existingTags} />
      </Suspense>
    </div>
  );
}

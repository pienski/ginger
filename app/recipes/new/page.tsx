import { Suspense } from "react";
import { db } from "@/lib/db";
import NewRecipeClient from "@/components/recipes/NewRecipeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Recipe",
};

export default async function NewRecipePage() {
  const categories = process.env.CATEGORIES 
    ? process.env.CATEGORIES.split(',').map(c => c.trim()).filter(Boolean) 
    : [];

  const allRecipes = await db.query.recipes.findMany({
    columns: {
      tags: true,
    },
  });

  const dbTags = new Set(allRecipes.flatMap((r) => r.tags as string[]));
  const otherTags = Array.from(dbTags)
    .filter(tag => !categories.includes(tag))
    .sort((a, b) => a.localeCompare(b));

  const existingTags = [...categories, ...otherTags];

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="max-w-4xl mx-auto py-20 text-center text-gray-500 dark:text-gray-400">Loading...</div>}>
        <NewRecipeClient existingTags={existingTags} />
      </Suspense>
    </div>
  );
}

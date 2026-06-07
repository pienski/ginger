import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RecipeForm from "@/components/recipes/RecipeForm";

export const dynamic = "force-dynamic";

interface EditRecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  const [recipe, allRecipes] = await Promise.all([
    db.query.recipes.findFirst({
      where: eq(recipes.id, id),
    }),
    db.query.recipes.findMany({
      columns: {
        tags: true,
      },
    }),
  ]);

  if (!recipe) {
    notFound();
  }

  const existingTags = Array.from(
    new Set(allRecipes.flatMap((r) => r.tags as string[])),
  ).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Recipe</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Update the details for &quot;{recipe.title}&quot;.</p>
      </div>
      <RecipeForm initialData={recipe} isEditing={true} existingTags={existingTags} />
    </div>
  );
}

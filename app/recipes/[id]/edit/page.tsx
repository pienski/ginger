import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RecipeForm from "@/components/recipes/RecipeForm";

interface EditRecipePageProps {
  params: {
    id: string;
  };
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, params.id),
  });

  if (!recipe) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
        <p className="text-gray-500 mt-2">Update the details for &quot;{recipe.title}&quot;.</p>
      </div>
      <RecipeForm initialData={recipe} isEditing={true} />
    </div>
  );
}

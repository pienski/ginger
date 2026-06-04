import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import IngredientList from "@/components/recipes/IngredientList";
import DirectionSteps from "@/components/recipes/DirectionSteps";
import DeleteButton from "@/components/recipes/DeleteButton";
import { getTagStyles, cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
  });

  if (!recipe) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Left column: Photo (or placeholder) */}
        <div className="w-full md:w-1/2 lg:w-2/5">
          {recipe.photo_url ? (
            <img
              src={recipe.photo_url}
              alt={recipe.title}
              className="w-full h-[300px] md:h-[450px] object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full h-[300px] md:h-[450px] bg-gray-100 rounded-xl flex items-center justify-center text-8xl shadow-inner border border-dashed border-gray-300">
              🍳
            </div>
          )}
        </div>

        {/* Right column: Title, tags, description, meta */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => {
                const styles = getTagStyles(tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                      styles.bg,
                      styles.text,
                      styles.border,
                    )}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {recipe.description && (
            <p className="text-lg text-gray-600 mb-6 italic">{recipe.description}</p>
          )}

          <div className="mt-auto space-y-4 pt-6 border-t border-gray-100">
            {recipe.source_url && (
              <p className="text-sm text-gray-500">
                Source:{" "}
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Original Recipe
                </a>
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit Recipe
                </Link>
                <DeleteButton recipeId={recipe.id} recipeTitle={recipe.title} />
              </div>
              <Link
                href="/recipes"
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <IngredientList
            ingredients={recipe.ingredients}
            baseServings={recipe.servings}
            useIngredientGroups={recipe.use_ingredient_groups}
          />
          {recipe.notes && (
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-100 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <span>📝</span> Notes
              </h4>
              <div className="text-yellow-900 markdown-content">
                <ReactMarkdown>{recipe.notes}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
          <DirectionSteps directions={recipe.directions} />
        </div>
      </div>
    </div>
  );
}

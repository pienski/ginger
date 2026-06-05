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

export const dynamic = "force-dynamic";

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
            <div className="w-full h-[300px] md:h-[450px] bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-8xl shadow-inner border border-dashed border-gray-300 dark:border-zinc-700">
              🍳
            </div>
          )}
        </div>

        {/* Right column: Title, tags, description, meta */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{recipe.title}</h1>
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
                      "dark:bg-opacity-10 dark:border-opacity-30"
                    )}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {recipe.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">{recipe.description}</p>
          )}

          <div className="mt-auto space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
              {recipe.source_url && (
                <p>
                  Source:{" "}
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:underline"
                  >
                    Original Recipe
                  </a>
                </p>
              )}
              
              <div className="space-y-0.5 text-xs text-gray-400 dark:text-gray-500 text-right ml-auto">
                <p>Created: {new Date(recipe.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                {recipe.updated_at && Math.abs(recipe.updated_at.getTime() - recipe.created_at.getTime()) > 1000 && (
                  <p>Last edited: {new Date(recipe.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-4">
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Edit Recipe
                </Link>
                <DeleteButton recipeId={recipe.id} recipeTitle={recipe.title} />
              </div>
              <Link
                href="/recipes"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
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
            <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
              <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
                <span>📝</span> Notes
              </h4>
              <div className="text-yellow-900 dark:text-yellow-200 markdown-content">
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

import Link from "next/link";
import { Recipe } from "@/lib/db/schema";
import { getTagStyles, cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe & { last_cooked_at: Date | null };
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group border dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-zinc-900 flex flex-col h-full"
    >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        {recipe.photo_url ? (
          <img
            src={recipe.photo_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <span className="text-4xl">🍳</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold mb-2 line-clamp-1 text-gray-900 dark:text-gray-100">{recipe.title}</h2>
        
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.map((tag) => {
              const styles = getTagStyles(tag);
              return (
                <span
                  key={tag}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium border transition-colors",
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
        )}

        <div className="mt-auto pt-2 border-t dark:border-zinc-800 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>{recipe.servings} servings</span>
          {recipe.last_cooked_at && (
            <span>
              Last: {new Date(recipe.last_cooked_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

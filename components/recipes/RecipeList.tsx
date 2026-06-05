"use client";

import { useState, useMemo } from "react";
import { Recipe } from "@/lib/db/schema";
import RecipeCard from "./RecipeCard";
import { getTagStyles, cn } from "@/lib/utils";

type RecipeWithLastCooked = Recipe & { last_cooked_at: Date | null };

interface RecipeListProps {
  initialRecipes: RecipeWithLastCooked[];
}

type SortOption = "recently_added" | "recently_cooked" | "alphabetical";

export default function RecipeList({ initialRecipes }: RecipeListProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialRecipes.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [initialRecipes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredAndSortedRecipes = useMemo(() => {
    return initialRecipes
      .filter((recipe) => {
        const matchesSearch = recipe.title
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => recipe.tags.includes(tag));
        return matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        if (sortBy === "recently_added") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        if (sortBy === "recently_cooked") {
          const dateA = a.last_cooked_at ? new Date(a.last_cooked_at).getTime() : 0;
          const dateB = b.last_cooked_at ? new Date(b.last_cooked_at).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [initialRecipes, search, selectedTags, sortBy]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full px-4 py-2 border dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="recently_added">Recently Added</option>
            <option value="recently_cooked">Recently Cooked</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const styles = getTagStyles(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border transition-all",
                  isSelected
                    ? `${styles.bg} ${styles.text} ${styles.border} shadow-sm scale-105 dark:bg-opacity-20`
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRecipes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-12">
            No recipes found matching your criteria.
          </p>
        ) : (
          filteredAndSortedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}

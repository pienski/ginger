"use client";

import { useState, useMemo } from "react";
import { Recipe } from "@/lib/db/schema";
import RecipeCard from "./RecipeCard";

type RecipeWithLastCooked = Recipe & { last_cooked_at: Date | null };

interface RecipeListProps {
  initialRecipes: RecipeWithLastCooked[];
}

type SortOption = "recently_added" | "recently_cooked" | "alphabetical";

export default function RecipeList({ initialRecipes }: RecipeListProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialRecipes.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [initialRecipes]);

  const filteredAndSortedRecipes = useMemo(() => {
    return initialRecipes
      .filter((recipe) => {
        const matchesSearch = recipe.title
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesTag = selectedTag === "" || recipe.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
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
  }, [initialRecipes, search, selectedTag, sortBy]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="recently_added">Recently Added</option>
            <option value="recently_cooked">Recently Cooked</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRecipes.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-12">
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

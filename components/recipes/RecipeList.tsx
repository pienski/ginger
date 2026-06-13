"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { RecipeWithLastCooked, SortOption, getRecipes } from "@/lib/actions/recipes";
import RecipeCard from "./RecipeCard";
import { getTagStyles, cn } from "@/lib/utils";
import { Loader2, Search, X } from "lucide-react";

interface RecipeListProps {
  initialRecipes: RecipeWithLastCooked[];
  categories?: string[];
  serverTags?: string[];
}

const ITEMS_PER_PAGE = 15;

export default function RecipeList({ initialRecipes, categories = [], serverTags = [] }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithLastCooked[]>(initialRecipes);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialRecipes.length === ITEMS_PER_PAGE);
  const [offset, setOffset] = useState(initialRecipes.length);
  const isFirstRender = useRef(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle filter/sort changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const refreshRecipes = async () => {
      setIsInitialLoading(true);
      const newRecipes = await getRecipes({
        limit: ITEMS_PER_PAGE,
        offset: 0,
        search: debouncedSearch,
        tags: selectedTags,
        sortBy,
      });
      setRecipes(newRecipes);
      setOffset(newRecipes.length);
      setHasMore(newRecipes.length === ITEMS_PER_PAGE);
      setIsInitialLoading(false);
    };

    refreshRecipes();
  }, [debouncedSearch, selectedTags, sortBy]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const nextRecipes = await getRecipes({
      limit: ITEMS_PER_PAGE,
      offset,
      search: debouncedSearch,
      tags: selectedTags,
      sortBy,
    });
    
    setRecipes((prev) => [...prev, ...nextRecipes]);
    setOffset((prev) => prev + nextRecipes.length);
    setHasMore(nextRecipes.length === ITEMS_PER_PAGE);
    setLoading(false);
  }, [loading, hasMore, offset, debouncedSearch, selectedTags, sortBy]);

  // Intersection Observer for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastRecipeElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isInitialLoading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [loading, isInitialLoading, hasMore, loadMore]
  );

  const allTags = useMemo(() => {
    const otherTags = serverTags.filter(t => !categories.includes(t));
    return [...categories, ...otherTags];
  }, [serverTags, categories]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2.5 border border-gray-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer min-w-[160px]"
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
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all font-sans",
                  isSelected
                    ? `${styles.bg} ${styles.text} ${styles.border} shadow-sm scale-105 dark:bg-opacity-20`
                    : "bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {tag}
              </button>
            );
          })}
          {(selectedTags.length > 0 || search) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p className="text-sm font-medium">Updating list...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-gray-50/50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No recipes found matching your criteria.
                </p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Clear all filters and search again
                </button>
              </div>
            ) : (
              recipes.map((recipe, index) => {
                if (recipes.length === index + 1) {
                  return (
                    <div ref={lastRecipeElementRef} key={recipe.id}>
                      <RecipeCard recipe={recipe} />
                    </div>
                  );
                } else {
                  return <RecipeCard key={recipe.id} recipe={recipe} />;
                }
              })
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12 mb-8">
              <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-full shadow-sm">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading more deliciousness...</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Scroll for more</span>
                )}
              </div>
            </div>
          )}
          
          {!hasMore && recipes.length > 0 && (
            <div className="flex justify-center mt-12 mb-8">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500 italic">
                You&apos;ve reached the end of the cookbook ✨
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

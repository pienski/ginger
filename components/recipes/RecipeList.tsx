"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { RecipeWithLastCooked, SortOption, getRecipes } from "@/lib/actions/recipes";
import RecipeCard from "./RecipeCard";
import { getTagStyles, cn } from "@/lib/utils";
import {
  saveRecipeListState,
  loadRecipeListState,
  clearRecipeListState,
  buildRecipeQueryString,
  parseRecipeSearchParams,
  RESET_RECIPES_EVENT,
} from "@/lib/recipe-session";
import { Loader2, Search, X, Users } from "lucide-react";

interface RecipeListProps {
  initialRecipes: RecipeWithLastCooked[];
  categories?: string[];
  serverTags?: string[];
  initialFilters?: {
    search?: string;
    tags?: string[];
    sortBy?: SortOption;
    onlyOurs?: boolean;
  };
}

const ITEMS_PER_PAGE = 15;

export default function RecipeList({
  initialRecipes,
  categories = [],
  serverTags = [],
  initialFilters,
}: RecipeListProps) {
  const initSearch = initialFilters?.search ?? "";
  const initTags = useMemo(() => initialFilters?.tags ?? [], [initialFilters?.tags]);
  const initSortBy = initialFilters?.sortBy ?? "recently_added";
  const initOnlyOurs = initialFilters?.onlyOurs ?? false;

  const [recipes, setRecipes] = useState<RecipeWithLastCooked[]>(initialRecipes);
  const [search, setSearch] = useState(initSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>(initTags);
  const [sortBy, setSortBy] = useState<SortOption>(initSortBy);
  const [onlyOurs, setOnlyOurs] = useState(initOnlyOurs);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialRecipes.length === ITEMS_PER_PAGE);
  const [offset, setOffset] = useState(initialRecipes.length);
  const [isRestoring, setIsRestoring] = useState(false);

  const isFirstRender = useRef(true);
  const isRestoringRef = useRef(false);
  const scrollYRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Store last applied filters to prevent unwanted refetches during session restoration
  const prevFiltersRef = useRef({
    search: initSearch,
    tags: initTags,
    sortBy: initSortBy,
    onlyOurs: initOnlyOurs,
  });

  // Store restore target until rendered recipes are committed to the DOM
  const pendingRestoreRef = useRef<{
    targetY: number;
    targetRecipeId?: string | null;
    targetRecipeTop?: number | null;
    count: number;
  } | null>(null);

  // Keep refs in sync with latest state
  const recipesRef = useRef(recipes);
  const searchRef = useRef(search);
  const debouncedSearchRef = useRef(debouncedSearch);
  const selectedTagsRef = useRef(selectedTags);
  const sortByRef = useRef(sortBy);
  const onlyOursRef = useRef(onlyOurs);
  const offsetRef = useRef(offset);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    recipesRef.current = recipes;
    searchRef.current = search;
    debouncedSearchRef.current = debouncedSearch;
    selectedTagsRef.current = selectedTags;
    sortByRef.current = sortBy;
    onlyOursRef.current = onlyOurs;
    offsetRef.current = offset;
    hasMoreRef.current = hasMore;
  });

  // Track window scroll position and configure manual scroll restoration for Firefox / Chrome
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        scrollYRef.current = window.scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save state when interacting with a recipe card
  const handleCardInteraction = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    if (typeof window === "undefined") return;
    const target = e.target as HTMLElement | null;
    const cardEl = target?.closest<HTMLAnchorElement>('a[id^="recipe-card-"]');

    let targetRecipeId: string | null = null;
    let targetRecipeTop: number | null = null;

    if (cardEl) {
      targetRecipeId = cardEl.id.replace("recipe-card-", "");
      targetRecipeTop = Math.round(cardEl.getBoundingClientRect().top);
    }

    const currentScrollY = scrollYRef.current > 0 ? scrollYRef.current : window.scrollY;

    saveRecipeListState({
      recipes: recipesRef.current,
      search: searchRef.current,
      selectedTags: selectedTagsRef.current,
      sortBy: sortByRef.current,
      onlyOurs: onlyOursRef.current,
      offset: offsetRef.current,
      hasMore: hasMoreRef.current,
      scrollY: currentScrollY,
      targetRecipeId,
      targetRecipeTop,
    });
  }, []);

  // Restore state from sessionStorage on initial client mount if returning to the same list view
  useEffect(() => {
    queueMicrotask(() => {
      const currentUrlSearch = typeof window !== "undefined" ? window.location.search : "";
      const urlFilters = parseRecipeSearchParams(currentUrlSearch);
      const cached = loadRecipeListState();

      if (cached) {
        const tagsMatch =
          cached.selectedTags.length === urlFilters.selectedTags.length &&
          cached.selectedTags.every((t) => urlFilters.selectedTags.includes(t));

        const filtersMatch =
          cached.search === urlFilters.search &&
          tagsMatch &&
          cached.sortBy === urlFilters.sortBy &&
          cached.onlyOurs === urlFilters.onlyOurs;

        if (filtersMatch) {
          isRestoringRef.current = true;
          setIsRestoring(true);

          prevFiltersRef.current = {
            search: cached.search,
            tags: cached.selectedTags,
            sortBy: cached.sortBy,
            onlyOurs: cached.onlyOurs,
          };

          pendingRestoreRef.current = {
            targetY: cached.scrollY,
            targetRecipeId: cached.targetRecipeId,
            targetRecipeTop: cached.targetRecipeTop,
            count: cached.recipes.length,
          };

          setRecipes(cached.recipes);
          setSearch(cached.search);
          setDebouncedSearch(cached.search);
          setSelectedTags(cached.selectedTags);
          setSortBy(cached.sortBy);
          setOnlyOurs(cached.onlyOurs);
          setOffset(cached.offset);
          setHasMore(cached.hasMore);
          scrollYRef.current = cached.scrollY;

          // Sync URL query string with restored filters
          const qs = buildRecipeQueryString({
            search: cached.search,
            tags: cached.selectedTags,
            sortBy: cached.sortBy,
            onlyOurs: cached.onlyOurs,
          });
          window.history.replaceState(null, "", `/recipes${qs}`);
          return;
        } else {
          // Discard stale cache if current URL has different filters
          clearRecipeListState();
        }
      }

      // If no valid cache and client URL differs from SSR initial filters, sync state
      if (urlFilters.hasFilter) {
        const ssrTags = initTags;
        const tagsDiffer =
          urlFilters.selectedTags.length !== ssrTags.length ||
          urlFilters.selectedTags.some((t) => !ssrTags.includes(t));
        const filtersDiffer =
          urlFilters.search !== initSearch ||
          tagsDiffer ||
          urlFilters.sortBy !== initSortBy ||
          urlFilters.onlyOurs !== initOnlyOurs;

        if (filtersDiffer) {
          setSearch(urlFilters.search);
          setDebouncedSearch(urlFilters.search);
          setSelectedTags(urlFilters.selectedTags);
          setSortBy(urlFilters.sortBy);
          setOnlyOurs(urlFilters.onlyOurs);
        }
      }
    });
  }, [initSearch, initTags, initSortBy, initOnlyOurs]);

  // Execute scroll restoration once restored recipes are committed to the DOM
  useEffect(() => {
    if (!pendingRestoreRef.current) return;
    const { targetY, targetRecipeId, targetRecipeTop, count } = pendingRestoreRef.current;

    // Wait until recipes in state reach the expected count
    if (recipes.length < count) return;

    pendingRestoreRef.current = null;

    let frame = 0;
    const maxFrames = 6;

    const performScroll = () => {
      let applied = false;

      // 1. Position clicked card at exact viewport offset
      if (targetRecipeId) {
        const cardEl = document.getElementById(`recipe-card-${targetRecipeId}`);
        if (cardEl) {
          const cardTopInDoc = cardEl.getBoundingClientRect().top + window.scrollY;
          const desiredTop = targetRecipeTop ?? 100;
          const calculatedY = Math.max(0, cardTopInDoc - desiredTop);
          window.scrollTo({ top: calculatedY, behavior: "instant" });
          document.documentElement.scrollTop = calculatedY;
          applied = true;
        }
      }

      // 2. Fallback to pixel scroll target
      if (!applied && targetY > 0) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        document.documentElement.scrollTop = targetY;
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(performScroll);
      } else {
        isRestoringRef.current = false;
        setIsRestoring(false);
      }
    };

    requestAnimationFrame(performScroll);
  }, [recipes]);

  // Listen for reset events from header logo or nav
  useEffect(() => {
    const handleReset = async () => {
      isRestoringRef.current = false;
      setIsRestoring(false);
      pendingRestoreRef.current = null;
      clearRecipeListState();
      scrollYRef.current = 0;
      setSearch("");
      setDebouncedSearch("");
      setSelectedTags([]);
      setSortBy("recently_added");
      setOnlyOurs(false);
      window.history.replaceState(null, "", "/recipes");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setIsInitialLoading(true);
      try {
        const defaultRecipes = await getRecipes({
          limit: ITEMS_PER_PAGE,
          offset: 0,
          search: "",
          tags: [],
          sortBy: "recently_added",
          includeOtherFamilies: true,
        });
        prevFiltersRef.current = {
          search: "",
          tags: [],
          sortBy: "recently_added",
          onlyOurs: false,
        };
        setRecipes(defaultRecipes);
        setOffset(defaultRecipes.length);
        setHasMore(defaultRecipes.length === ITEMS_PER_PAGE);
      } catch (err) {
        console.error("Failed to reset recipe list:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    window.addEventListener(RESET_RECIPES_EVENT, handleReset);
    return () => window.removeEventListener(RESET_RECIPES_EVENT, handleReset);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync URL query string when active filters change
  useEffect(() => {
    if (isFirstRender.current || isRestoringRef.current) return;
    const qs = buildRecipeQueryString({
      search: debouncedSearch,
      tags: selectedTags,
      sortBy,
      onlyOurs,
    });
    const targetUrl = `/recipes${qs}`;
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [debouncedSearch, selectedTags, sortBy, onlyOurs]);

  // Handle user-initiated filter/sort changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isRestoringRef.current) {
      return;
    }

    const prev = prevFiltersRef.current;
    const tagsChanged =
      prev.tags.length !== selectedTags.length ||
      prev.tags.some((t, i) => t !== selectedTags[i]);
    const hasChanged =
      prev.search !== debouncedSearch ||
      tagsChanged ||
      prev.sortBy !== sortBy ||
      prev.onlyOurs !== onlyOurs;

    if (!hasChanged) return;

    prevFiltersRef.current = {
      search: debouncedSearch,
      tags: selectedTags,
      sortBy,
      onlyOurs,
    };

    const refreshRecipes = async () => {
      setIsInitialLoading(true);
      const newRecipes = await getRecipes({
        limit: ITEMS_PER_PAGE,
        offset: 0,
        search: debouncedSearch,
        tags: selectedTags,
        sortBy,
        includeOtherFamilies: !onlyOurs,
      });
      setRecipes(newRecipes);
      setOffset(newRecipes.length);
      setHasMore(newRecipes.length === ITEMS_PER_PAGE);
      setIsInitialLoading(false);
      scrollYRef.current = 0;

      // Save to session cache with scrollY: 0 since filters changed
      saveRecipeListState({
        recipes: newRecipes,
        search: debouncedSearch,
        selectedTags,
        sortBy,
        onlyOurs,
        offset: newRecipes.length,
        hasMore: newRecipes.length === ITEMS_PER_PAGE,
        scrollY: 0,
      });
    };

    refreshRecipes();
  }, [debouncedSearch, selectedTags, sortBy, onlyOurs]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || isRestoringRef.current) return;

    setLoading(true);
    try {
      const nextRecipes = await getRecipes({
        limit: ITEMS_PER_PAGE,
        offset: offsetRef.current,
        search: debouncedSearchRef.current,
        tags: selectedTagsRef.current,
        sortBy: sortByRef.current,
        includeOtherFamilies: !onlyOursRef.current,
      });

      setRecipes((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const uniqueNext = nextRecipes.filter((r) => !existingIds.has(r.id));
        return [...prev, ...uniqueNext];
      });
      setOffset((prev) => prev + nextRecipes.length);
      setHasMore(nextRecipes.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error("Failed to load more recipes:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // Sentinel Intersection Observer for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || isInitialLoading || isRestoring) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, isInitialLoading, isRestoring, loadMore]);

  const allTags = useMemo(() => {
    const otherTags = serverTags.filter((t) => !categories.includes(t));
    return [...categories, ...otherTags];
  }, [serverTags, categories]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    scrollYRef.current = 0;
    setSearch("");
    setDebouncedSearch("");
    setSelectedTags([]);
    setOnlyOurs(false);
    clearRecipeListState();
    window.history.replaceState(null, "", "/recipes");
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
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <label
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 border rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer select-none whitespace-nowrap",
              onlyOurs
                ? "bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
            )}
            title={onlyOurs ? "Showing only your family's recipes (click to show all)" : "Show only your family's recipes"}
          >
            <input
              type="checkbox"
              checked={onlyOurs}
              onChange={(e) => setOnlyOurs(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-zinc-800 cursor-pointer"
            />
            <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span>Only ours</span>
          </label>

          <select
            className="px-4 py-2.5 border border-gray-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer min-w-[160px] flex-1 sm:flex-initial"
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
          {(selectedTags.length > 0 || search || onlyOurs) && (
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
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            onClickCapture={handleCardInteraction}
            onPointerDownCapture={handleCardInteraction}
          >
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
              recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>

          {/* Sentinel element for infinite scroll */}
          {hasMore && <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />}

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

import type { RecipeWithLastCooked, SortOption } from "@/lib/actions/recipes";

export const RECIPES_STORAGE_KEY = "recipe_list_session_state";
export const RESET_RECIPES_EVENT = "reset-recipe-list";

export interface RecipeListSessionState {
  recipes: RecipeWithLastCooked[];
  search: string;
  selectedTags: string[];
  sortBy: SortOption;
  onlyOurs: boolean;
  offset: number;
  hasMore: boolean;
  scrollY: number;
  targetRecipeId?: string | null;
  targetRecipeTop?: number | null;
  timestamp: number;
}

export function saveRecipeListState(state: Omit<RecipeListSessionState, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: RecipeListSessionState = {
      ...state,
      scrollY: Math.max(0, Math.round(state.scrollY || 0)),
      timestamp: Date.now(),
    };
    sessionStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save recipe list state:", err);
  }
}

export function loadRecipeListState(): RecipeListSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECIPES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.recipes)) return null;
    return parsed as RecipeListSessionState;
  } catch (err) {
    console.error("Failed to load recipe list state:", err);
    return null;
  }
}

export function clearRecipeListState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RECIPES_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear recipe list state:", err);
  }
}

export function removeRecipeFromSession(recipeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const state = loadRecipeListState();
    if (!state) return;
    state.recipes = state.recipes.filter((r) => r.id !== recipeId);
    state.offset = Math.max(0, state.offset - 1);
    sessionStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to remove recipe from session:", err);
  }
}

export function updateRecipeInSession(recipe: Partial<RecipeWithLastCooked> & { id: string }): void {
  if (typeof window === "undefined") return;
  try {
    const state = loadRecipeListState();
    if (!state) return;
    state.recipes = state.recipes.map((r) => (r.id === recipe.id ? { ...r, ...recipe } : r));
    sessionStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to update recipe in session:", err);
  }
}

export function buildRecipeQueryString(params: {
  search?: string;
  tags?: string[];
  sortBy?: SortOption;
  onlyOurs?: boolean;
}): string {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.tags && params.tags.length > 0) {
    query.set("tags", params.tags.join(","));
  }
  if (params.sortBy && params.sortBy !== "recently_added") {
    query.set("sortBy", params.sortBy);
  }
  if (params.onlyOurs) {
    query.set("onlyOurs", "true");
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export function parseRecipeSearchParams(searchStr: string): {
  search: string;
  selectedTags: string[];
  sortBy: SortOption;
  onlyOurs: boolean;
  hasFilter: boolean;
} {
  const params = new URLSearchParams(searchStr);
  const search = params.get("search") || "";
  const rawTags = params.get("tags");
  const selectedTags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const rawSort = params.get("sortBy");
  const sortBy: SortOption =
    rawSort === "recently_cooked" || rawSort === "alphabetical"
      ? rawSort
      : "recently_added";
  const onlyOurs = params.get("onlyOurs") === "true";
  const hasFilter = Boolean(search || selectedTags.length > 0 || sortBy !== "recently_added" || onlyOurs);
  return { search, selectedTags, sortBy, onlyOurs, hasFilter };
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn, getTagStyles } from "@/lib/utils";
import { formatDayMonth, getTodayISO } from "@/lib/dates";
import { getSuggestions } from "@/lib/actions/meal-plan";
import { getRecipes } from "@/lib/actions/recipes";

export interface PickerItem {
  id: string;
  title: string;
  photo_url: string | null;
  photo_position: string | null;
  tags: string[];
  last_eaten: string | null; // 'YYYY-MM-DD'
}

interface RecipePickerModalProps {
  date: string;
  dayName: string;
  label: string;
  category: string;
  onClose: () => void;
  onSelect: (recipe: PickerItem) => void;
}

export default function RecipePickerModal({
  dayName,
  label,
  category,
  onClose,
  onSelect,
}: RecipePickerModalProps) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch: ranked suggestions when empty, title search via getRecipes otherwise.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let result: PickerItem[];
      if (debounced.trim()) {
        const recipes = await getRecipes({
          search: debounced,
          tags: showAll ? [] : [category],
          limit: 20,
        });
        result = recipes.map((r) => ({
          id: r.id,
          title: r.title,
          photo_url: r.photo_url,
          photo_position: r.photo_position,
          tags: r.tags,
          last_eaten: r.last_cooked_at,
        }));
      } else {
        const suggestions = await getSuggestions({
          category,
          today: getTodayISO(),
          all: showAll,
        });
        result = suggestions.map((s) => ({
          id: s.id,
          title: s.title,
          photo_url: s.photo_url,
          photo_position: s.photo_position,
          tags: s.tags,
          last_eaten: s.last_eaten,
        }));
      }
      if (!cancelled) {
        setItems(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, showAll, category]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold">Choose for {category}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dayName} · {label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-col gap-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search recipes..."
              className="w-full pl-10 pr-3 py-2.5 border border-gray-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {debounced.trim()
                ? "Search results"
                : showAll
                  ? "Suggestions · all recipes"
                  : `Suggestions · ${category}`}
            </span>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAll ? `Filter to ${category}` : "Show all recipes"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 dark:text-gray-400">No recipes found.</p>
              {!showAll && !debounced.trim() && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-3 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Show all recipes
                </button>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                      {item.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photo_url}
                          alt={item.title}
                          style={{ objectPosition: item.photo_position || "50% 50%" }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl text-gray-300 dark:text-gray-600">🍳</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.tags.slice(0, 3).map((tag) => {
                          const styles = getTagStyles(tag);
                          return (
                            <span
                              key={tag}
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                styles.bg,
                                styles.text,
                                styles.border,
                                "dark:bg-opacity-10 dark:border-opacity-30",
                              )}
                            >
                              {tag}
                            </span>
                          );
                        })}
                        <span className="text-[11px] italic text-gray-400">
                          {item.last_eaten ? `Last: ${formatDayMonth(item.last_eaten)}` : "Never made"}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

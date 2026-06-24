"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ClipboardList, Copy } from "lucide-react";
import { cn, getTagStyles } from "@/lib/utils";
import { addDays, formatWeekdayShort, getTodayISO } from "@/lib/dates";
import { buildGroceryMarkdown, type GroceryMeal } from "@/lib/markdown/grocery";
import type { RangeMeal } from "@/lib/actions/grocery";

interface GroceryBuilderProps {
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
  rangeProvided: boolean; // whether ?from/?to were in the URL
  categories: string[];
  meals: RangeMeal[];
}

// One planned slot is unique per (date, category).
const mealKey = (m: { date: string; category: string }) => `${m.date}|${m.category}`;

export default function GroceryBuilder({
  from,
  to,
  rangeProvided,
  categories,
  meals,
}: GroceryBuilderProps) {
  const router = useRouter();

  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(meals.map(mealKey)));
  const [servingsById, setServingsById] = useState<Record<string, number>>(() =>
    Object.fromEntries(meals.map((m) => [mealKey(m), m.servings])),
  );
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  // Re-align the default range to the client's local "today" when the server
  // guessed it (no explicit ?from/?to) and the timezones disagree. Mirrors /plan.
  useEffect(() => {
    if (rangeProvided) return;
    const clientToday = getTodayISO();
    if (clientToday !== from) {
      router.replace(`/grocery?from=${clientToday}&to=${addDays(clientToday, 6)}`);
    }
  }, [rangeProvided, from, router]);

  // Sort helper: meals within a day follow the configured category order.
  const categoryRank = useMemo(() => {
    const rank = new Map(categories.map((c, i) => [c, i]));
    return (cat: string) => rank.get(cat) ?? categories.length;
  }, [categories]);

  // Meals grouped by date (ascending), each day's meals ordered by category.
  const days = useMemo(() => {
    const byDate = new Map<string, RangeMeal[]>();
    for (const m of meals) {
      if (!byDate.has(m.date)) byDate.set(m.date, []);
      byDate.get(m.date)!.push(m);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, items]) => ({
        date,
        items: [...items].sort((x, y) => categoryRank(x.category) - categoryRank(y.category)),
      }));
  }, [meals, categoryRank]);

  const applyRange = (nextFrom: string, nextTo: string) => {
    const [f, t] = nextFrom <= nextTo ? [nextFrom, nextTo] : [nextTo, nextFrom];
    router.push(`/grocery?from=${f}&to=${t}`);
  };

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setServings = (key: string, value: number) =>
    setServingsById((prev) => ({ ...prev, [key]: Math.max(1, value) }));

  const allSelected = meals.length > 0 && selected.size === meals.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(meals.map(mealKey)));

  const selectedMeals: GroceryMeal[] = useMemo(
    () =>
      meals
        .filter((m) => selected.has(mealKey(m)))
        .map((m) => ({
          title: m.title,
          baseServings: m.baseServings,
          servings: servingsById[mealKey(m)] ?? m.servings,
          ingredients: m.ingredients,
        })),
    [meals, selected, servingsById],
  );

  // Output is derived from the current selection/servings; "Generate" just reveals
  // it, after which it stays in sync with any later tweaks.
  const markdown = useMemo(
    () => buildGroceryMarkdown(selectedMeals, { from: fromDate, to: toDate }),
    [selectedMeals, fromDate, toDate],
  );

  const generate = () => {
    setShowOutput(true);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy grocery list:", err);
    }
  };

  const dateInputClass =
    "px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Groceries</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Pick a date range, choose meals and servings, then generate a shopping list.
      </p>

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (e.target.value) applyRange(e.target.value, toDate);
            }}
            className={dateInputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => {
              setToDate(e.target.value);
              if (e.target.value) applyRange(fromDate, e.target.value);
            }}
            className={dateInputClass}
          />
        </label>
      </div>

      {meals.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
          <p className="font-medium">No planned meals in this range.</p>
          <p className="text-sm mt-1">
            Add meals on the{" "}
            <Link href="/plan" className="text-blue-600 dark:text-blue-400 hover:underline">
              Meal Plan
            </Link>{" "}
            first, or widen the dates.
          </p>
        </div>
      ) : (
        <>
          {/* Selection summary */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {selected.size} of {meals.length} meals selected
            </span>
            <button
              onClick={toggleAll}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          {/* Agenda: one card per day */}
          <div className="flex flex-col gap-4">
            {days.map((day) => {
              const dayKeys = day.items.map(mealKey);
              const dayAll = dayKeys.every((k) => selected.has(k));
              const toggleDay = () =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  for (const k of dayKeys) {
                    if (dayAll) next.delete(k);
                    else next.add(k);
                  }
                  return next;
                });

              return (
                <div
                  key={day.date}
                  className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{formatWeekdayShort(day.date)}</span>
                    <button
                      onClick={toggleDay}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {dayAll ? "Clear day" : "Select day"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {day.items.map((m) => {
                      const key = mealKey(m);
                      const isSel = selected.has(key);
                      const servings = servingsById[key] ?? m.servings;
                      const styles = getTagStyles(m.category);

                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                            isSel
                              ? "border-blue-300 bg-blue-50/40 dark:border-blue-500/40 dark:bg-blue-900/10"
                              : "border-gray-100 dark:border-zinc-800 opacity-60",
                          )}
                        >
                          <button
                            onClick={() => toggle(key)}
                            aria-pressed={isSel}
                            aria-label={isSel ? "Exclude this meal" : "Include this meal"}
                            className={cn(
                              "w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors",
                              isSel
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "border-gray-300 dark:border-zinc-600",
                            )}
                          >
                            {isSel && <Check className="w-3.5 h-3.5" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border mb-0.5",
                                styles.bg,
                                styles.text,
                                styles.border,
                                "dark:bg-opacity-10 dark:border-opacity-30",
                              )}
                            >
                              {m.category}
                            </span>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                              {m.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 border border-gray-100 dark:border-zinc-800 rounded-lg p-1 bg-gray-50/50 dark:bg-zinc-800/50">
                            <button
                              type="button"
                              onClick={() => setServings(key, servings - 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-gray-500 dark:text-gray-400"
                              aria-label="Fewer servings"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-gray-100">
                              {servings}
                            </span>
                            <button
                              type="button"
                              onClick={() => setServings(key, servings + 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-gray-500 dark:text-gray-400"
                              aria-label="More servings"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={selectedMeals.length === 0}
            className={cn(
              "mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors",
              selectedMeals.length === 0
                ? "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Generate grocery list
          </button>

          {/* Output */}
          {showOutput && (
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                <span className="text-sm font-semibold">Grocery list (Markdown)</span>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={markdown}
                rows={Math.min(28, markdown.split("\n").length + 1)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full p-4 font-mono text-sm bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-200 resize-y focus:outline-none"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { addWeeks, getWeekDates, getWeekStart, getTodayISO } from "@/lib/dates";
import { cn, getTagStyles } from "@/lib/utils";
import type { PlannedMeal, WeekPlan } from "@/lib/actions/meal-plan";
import RecipePickerModal, { type PickerItem } from "./RecipePickerModal";

interface MealPlanCalendarProps {
  weekStart: string; // Monday 'YYYY-MM-DD'
  weekProvided: boolean; // whether ?week= was in the URL
  categories: string[];
  plan: WeekPlan;
}

interface SlotRef {
  date: string;
  label: string;
  dayName: string;
  category: string;
}

const slotKey = (date: string, category: string) => `${date}|${category}`;

export default function MealPlanCalendar({
  weekStart,
  weekProvided,
  categories,
  plan: initialPlan,
}: MealPlanCalendarProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<WeekPlan>(initialPlan);
  const [picker, setPicker] = useState<SlotRef | null>(null);
  const [todayISO, setTodayISO] = useState<string | null>(null);

  const days = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Compute "today" on the client only (avoids SSR/hydration timezone mismatch).
  useEffect(() => {
    setTodayISO(getTodayISO());
  }, []);

  // If no week was specified and the client's current week differs from the
  // server's guess (timezone gap), re-align the URL to the browser's week.
  useEffect(() => {
    if (weekProvided) return;
    const clientWeek = getWeekStart();
    if (clientWeek !== weekStart) {
      router.replace(`/plan?week=${clientWeek}`);
    }
  }, [weekProvided, weekStart, router]);

  const goToWeek = (iso: string) => router.push(`/plan?week=${iso}`);

  const assignRecipe = async (slot: SlotRef, recipe: PickerItem) => {
    const key = slotKey(slot.date, slot.category);
    const previous = plan[key];
    const optimistic: PlannedMeal = {
      date: slot.date,
      category: slot.category,
      recipe_id: recipe.id,
      title: recipe.title,
      photo_url: recipe.photo_url,
      photo_position: recipe.photo_position,
    };
    setPlan((p) => ({ ...p, [key]: optimistic }));
    setPicker(null);

    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: slot.date,
          category: slot.category,
          recipe_id: recipe.id,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (error) {
      console.error("Failed to assign meal:", error);
      // Roll back to the previous cell value.
      setPlan((p) => {
        const next = { ...p };
        if (previous) next[key] = previous;
        else delete next[key];
        return next;
      });
      alert("Couldn't save that meal. Please try again.");
    }
  };

  const removeRecipe = async (slot: SlotRef) => {
    const key = slotKey(slot.date, slot.category);
    const previous = plan[key];
    if (!previous) return;
    setPlan((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch(
        `/api/meal-plan?date=${slot.date}&category=${encodeURIComponent(slot.category)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (error) {
      console.error("Failed to remove meal:", error);
      setPlan((p) => ({ ...p, [key]: previous })); // restore
      alert("Couldn't remove that meal. Please try again.");
    }
  };

  const monthSpan = `${days[0].label} – ${days[6].label}`;

  return (
    <div>
      {/* Header + week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Meal Plan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToWeek(addWeeks(weekStart, -1))}
            className="p-2 rounded-full border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goToWeek(getWeekStart())}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => goToWeek(addWeeks(weekStart, 1))}
            className="p-2 rounded-full border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {monthSpan}
          </span>
        </div>
      </div>

      {/* Desktop grid: days (rows) × categories (columns) */}
      <div
        className="hidden md:grid gap-2"
        style={{
          gridTemplateColumns: `7rem repeat(${categories.length}, minmax(0, 1fr))`,
        }}
      >
        <div /> {/* empty corner */}
        {categories.map((category) => {
          const styles = getTagStyles(category);
          return (
            <div
              key={category}
              className={cn(
                "text-center text-sm font-semibold py-2 rounded-lg border",
                styles.bg,
                styles.text,
                styles.border,
                "dark:bg-opacity-10 dark:border-opacity-30",
              )}
            >
              {category}
            </div>
          );
        })}

        {days.map((day) => (
          <FragmentRow
            key={day.date}
            day={day}
            categories={categories}
            plan={plan}
            isToday={day.date === todayISO}
            onPick={(category) =>
              setPicker({ date: day.date, label: day.label, dayName: day.dayName, category })
            }
            onRemove={(category) =>
              removeRecipe({ date: day.date, label: day.label, dayName: day.dayName, category })
            }
          />
        ))}
      </div>

      {/* Mobile: per-day cards */}
      <div className="md:hidden flex flex-col gap-4">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "rounded-xl border p-4",
              day.date === todayISO
                ? "border-blue-400 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-900/10"
                : "border-gray-200 dark:border-zinc-800",
            )}
          >
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-semibold">{day.dayName}</span>
              <span className="text-sm text-gray-400">{day.label}</span>
              {day.date === todayISO && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Today</span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {categories.map((category) => (
                <div key={category}>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {category}
                  </div>
                  <Cell
                    meal={plan[slotKey(day.date, category)]}
                    onPick={() =>
                      setPicker({
                        date: day.date,
                        label: day.label,
                        dayName: day.dayName,
                        category,
                      })
                    }
                    onRemove={() =>
                      removeRecipe({
                        date: day.date,
                        label: day.label,
                        dayName: day.dayName,
                        category,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {picker && (
        <RecipePickerModal
          date={picker.date}
          dayName={picker.dayName}
          label={picker.label}
          category={picker.category}
          onClose={() => setPicker(null)}
          onSelect={(recipe) => assignRecipe(picker, recipe)}
        />
      )}
    </div>
  );
}

// One desktop grid row: a day label cell followed by one cell per category.
function FragmentRow({
  day,
  categories,
  plan,
  isToday,
  onPick,
  onRemove,
}: {
  day: { date: string; dayName: string; label: string };
  categories: string[];
  plan: WeekPlan;
  isToday: boolean;
  onPick: (category: string) => void;
  onRemove: (category: string) => void;
}) {
  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-center px-2 py-3 rounded-lg",
          isToday && "bg-blue-50 dark:bg-blue-900/15",
        )}
      >
        <span className={cn("font-semibold", isToday && "text-blue-600 dark:text-blue-400")}>
          {day.dayName}
        </span>
        <span className="text-xs text-gray-400">{day.label}</span>
      </div>
      {categories.map((category) => (
        <Cell
          key={category}
          meal={plan[slotKey(day.date, category)]}
          onPick={() => onPick(category)}
          onRemove={() => onRemove(category)}
        />
      ))}
    </>
  );
}

// A single slot: either an assigned recipe or an empty "+ Add" target.
function Cell({
  meal,
  onPick,
  onRemove,
}: {
  meal: PlannedMeal | undefined;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (!meal) {
    return (
      <button
        onClick={onPick}
        className="group min-h-[3.5rem] w-full rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-colors"
      >
        <Plus className="w-4 h-4 mr-1" />
        <span className="text-xs font-medium">Add</span>
      </button>
    );
  }

  return (
    <div className="group relative flex items-center gap-2 min-h-[3.5rem] w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all">
      <Link
        href={`/recipes/${meal.recipe_id}`}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        <div className="w-11 h-11 shrink-0 rounded-md overflow-hidden bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center">
          {meal.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meal.photo_url}
              alt={meal.title}
              style={{ objectPosition: meal.photo_position || "50% 50%" }}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg">🍳</span>
          )}
        </div>
        <span className="text-xs font-medium leading-snug line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {meal.title}
        </span>
      </Link>
      <div className="flex items-center gap-0.5 shrink-0 self-start opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <button
          onClick={onPick}
          title="Change"
          className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRemove}
          title="Remove"
          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

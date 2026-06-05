"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ingredient, Recipe } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { getTagStyles, cn } from "@/lib/utils";

type FormIngredient = Ingredient & { id: string };
type FormGroup = { id: string; name: string; ingredients: FormIngredient[] };

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  isEditing?: boolean;
  existingTags?: string[];
}

// "Dumb" visual component for an ingredient row
function IngredientRow({
  ingredient,
  onUpdate,
  onRemove,
  isOverlay = false,
  dragHandleProps = {},
  dragHandleListeners = {},
}: {
  ingredient: FormIngredient;
  onUpdate?: (field: keyof Ingredient, value: string | number | null) => void;
  onRemove?: () => void;
  isOverlay?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleListeners?: any;
}) {
  return (
    <div
      className={`flex gap-2 items-start bg-white dark:bg-zinc-900 transition-colors ${isOverlay ? "shadow-xl border dark:border-zinc-700 rounded-md p-2 z-50 cursor-grabbing" : ""}`}
    >
      <button
        type="button"
        className="mt-2 p-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-300"
        {...dragHandleProps}
        {...dragHandleListeners}
      >
        <GripVertical size={20} />
      </button>
      <input
        type="number"
        step="any"
        placeholder="Qty"
        className="w-20 border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
        value={ingredient.amount}
        onChange={(e) => onUpdate?.("amount", e.target.value)}
      />
      <input
        type="text"
        placeholder="Unit"
        className="w-24 border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
        value={ingredient.unit || ""}
        onChange={(e) => onUpdate?.("unit", e.target.value)}
      />
      <div className="flex gap-1 items-center">
        <input
          type="number"
          placeholder="Metric"
          className="w-24 border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          value={ingredient.metric_amount || ""}
          onChange={(e) => onUpdate?.("metric_amount", e.target.value)}
        />
        <select
          className="border dark:border-zinc-800 rounded-md px-1 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          value={ingredient.metric_unit || "g"}
          onChange={(e) => onUpdate?.("metric_unit", e.target.value)}
        >
          <option value="g">g</option>
          <option value="ml">ml</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Ingredient name"
        className="flex-grow border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
        value={ingredient.name}
        onChange={(e) => onUpdate?.("name", e.target.value)}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      >
        &times;
      </button>
    </div>
  );
}

// Sortable wrapper for ingredient row
function SortableIngredientRow({
  ingredient,
  onUpdate,
  onRemove,
}: {
  ingredient: FormIngredient;
  onUpdate: (field: keyof Ingredient, value: string | number | null) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IngredientRow
        ingredient={ingredient}
        onUpdate={onUpdate}
        onRemove={onRemove}
        dragHandleProps={attributes}
        dragHandleListeners={listeners}
      />
    </div>
  );
}

// "Dumb" visual component for a group container
function GroupContainer({
  group,
  onUpdateName,
  onRemove,
  onAddIngredient,
  isOverlay = false,
  dragHandleProps = {},
  dragHandleListeners = {},
  children,
}: {
  group: FormGroup;
  onUpdateName?: (name: string) => void;
  onRemove?: () => void;
  onAddIngredient?: () => void;
  isOverlay?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleListeners?: any;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`border dark:border-zinc-800 rounded-lg p-4 bg-gray-50 dark:bg-zinc-800/50 space-y-4 transition-colors ${isOverlay ? "shadow-2xl border-blue-400 dark:border-blue-500 z-50 cursor-grabbing" : ""}`}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-grow">
          <button
            type="button"
            className="p-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-300"
            {...dragHandleProps}
            {...dragHandleListeners}
          >
            <GripVertical size={20} />
          </button>
          <input
            type="text"
            placeholder="Group Name (e.g. Sauce)"
            className="flex-grow font-semibold bg-transparent border-b border-gray-300 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none px-1 py-1 text-gray-900 dark:text-gray-100 transition-colors"
            value={group.name}
            onChange={(e) => onUpdateName?.(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 dark:text-red-400 text-sm hover:underline"
        >
          Remove Group
        </button>
      </div>

      <div className="space-y-3">
        {!isOverlay && (
          <div className="hidden md:flex gap-2 mb-1 text-xs font-medium text-gray-400 dark:text-gray-500 pl-8">
            <div className="w-20">Qty</div>
            <div className="w-24">Unit</div>
            <div className="w-36">Amount (g/ml)</div>
            <div className="flex-grow">Ingredient Name</div>
            <div className="w-10"></div>
          </div>
        )}
        {children}
      </div>

      {!isOverlay && (
        <button
          type="button"
          onClick={onAddIngredient}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline ml-8"
        >
          + Add Ingredient to {group.name || "Group"}
        </button>
      )}
    </div>
  );
}

// Sortable wrapper for group
function SortableGroup({
  group,
  onUpdateName,
  onRemove,
  onAddIngredient,
  children,
}: {
  group: FormGroup;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  onAddIngredient: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GroupContainer
        group={group}
        onUpdateName={onUpdateName}
        onRemove={onRemove}
        onAddIngredient={onAddIngredient}
        dragHandleProps={attributes}
        dragHandleListeners={listeners}
      >
        {children}
      </GroupContainer>
    </div>
  );
}

export default function RecipeForm({
  initialData,
  isEditing = false,
  existingTags,
}: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || "");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload image");
      }

      const blob = await response.json();
      setPhotoUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };
  const [servings, setServings] = useState(initialData?.servings || 2);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const handleNewTagChange = (value: string) => {
    setNewTag(value);
    setHighlightedSuggestionIndex(-1);
  };
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      highlightedSuggestionIndex >= 0 &&
      suggestionsContainerRef.current &&
      suggestionsContainerRef.current.children[highlightedSuggestionIndex]
    ) {
      const container = suggestionsContainerRef.current;
      const element = container.children[highlightedSuggestionIndex] as HTMLElement;

      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;

      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
      } else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
  }, [highlightedSuggestionIndex]);

  const filteredSuggestions = useMemo(() => {
    if (!existingTags) return [];
    const search = newTag.toLowerCase().trim();
    return existingTags
      .filter((tag) => !tags.includes(tag))
      .filter((tag) => tag.toLowerCase().includes(search))
      .sort();
  }, [existingTags, tags, newTag]);
  const [useIngredientGroups, setUseIngredientGroups] = useState(
    initialData?.use_ingredient_groups || false,
  );

  // Initialize ingredients and groups
  const initialIngredients: FormIngredient[] = useMemo(() => {
    return (
      initialData?.ingredients?.map((ing) => ({
        ...ing,
        id: createId(),
        metric_amount: ing.metric_amount ?? null,
        metric_unit: ing.metric_unit ?? "g",
        group: ing.group || "",
      })) || [
        {
          id: createId(),
          name: "",
          amount: 1,
          unit: "",
          metric_amount: null,
          metric_unit: "g",
          group: "",
        },
      ]
    );
  }, [initialData]);

  // If using groups, structured state. Otherwise, flat.
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    !useIngredientGroups ? initialIngredients : [],
  );

  const [groups, setGroups] = useState<FormGroup[]>(() => {
    if (!useIngredientGroups) return [];
    // Group them
    const gMap: Record<string, FormIngredient[]> = {};
    initialIngredients.forEach((ing) => {
      const gName = ing.group || "Other";
      if (!gMap[gName]) gMap[gName] = [];
      gMap[gName].push(ing);
    });
    return Object.entries(gMap).map(([name, ings]) => ({
      id: createId(),
      name: name === "Other" ? "" : name,
      ingredients: ings,
    }));
  });

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeGroup = useMemo(() => groups.find(g => g.id === activeId), [groups, activeId]);
  const activeIngredient = useMemo(() => {
    if (!activeId) return null;
    if (!useIngredientGroups) return ingredients.find(i => i.id === activeId);
    for (const g of groups) {
      const found = g.ingredients.find(i => i.id === activeId);
      if (found) return found;
    }
    return null;
  }, [ingredients, groups, activeId, useIngredientGroups]);

  const [directions, setDirections] = useState<string[]>(
    initialData?.directions || [""],
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url || "");

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Toggle groups handler
  const handleToggleGroups = (val: boolean) => {
    if (val === useIngredientGroups) return;
    setUseIngredientGroups(val);

    if (val) {
      // Flat -> Grouped
      const gMap: Record<string, FormIngredient[]> = {};
      ingredients.forEach((ing) => {
        const gName = ing.group || "Other";
        if (!gMap[gName]) gMap[gName] = [];
        gMap[gName].push(ing);
      });
      const newGroups = Object.entries(gMap).map(([name, ings]) => ({
        id: createId(),
        name: name === "Other" ? "" : name,
        ingredients: ings,
      }));
      setGroups(newGroups.length > 0 ? newGroups : [{ id: createId(), name: "", ingredients: [] }]);
      setIngredients([]);
    } else {
      // Grouped -> Flat
      const flattened = groups.flatMap((g) =>
        g.ingredients.map((ing) => ({ ...ing, group: g.name })),
      );
      setIngredients(flattened.length > 0 ? flattened : initialIngredients);
      setGroups([]);
    }
  };

  // Tag Handlers
  const addTag = (tagToAdd?: string) => {
    const tag = (typeof tagToAdd === "string" ? tagToAdd : newTag).trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Ingredient Handlers (Flat mode)
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: createId(),
        name: "",
        amount: 1,
        unit: "",
        metric_amount: null,
        metric_unit: "g",
        group: "",
      },
    ]);
  };
  const updateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string | number | null,
  ) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id !== id) return ing;
        const val =
          (field === "amount" || field === "metric_amount") && value !== ""
            ? Number(value)
            : value;
        return { ...ing, [field]: val };
      }),
    );
  };
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // Group Handlers
  const addGroup = () => {
    setGroups([...groups, { id: createId(), name: "", ingredients: [] }]);
  };
  const removeGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };
  const updateGroupName = (groupId: string, name: string) => {
    setGroups(
      groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    );
  };
  const addIngredientToGroup = (groupId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          ingredients: [
            ...g.ingredients,
            {
              id: createId(),
              name: "",
              amount: 1,
              unit: "",
              metric_amount: null,
              metric_unit: "g",
              group: g.name,
            },
          ],
        };
      }),
    );
  };
  const updateGroupIngredient = (
    groupId: string,
    ingId: string,
    field: keyof Ingredient,
    value: string | number | null,
  ) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          ingredients: g.ingredients.map((ing) => {
            if (ing.id !== ingId) return ing;
            const val =
              (field === "amount" || field === "metric_amount") && value !== ""
                ? Number(value)
                : value;
            return { ...ing, [field]: val };
          }),
        };
      }),
    );
  };
  const removeGroupIngredient = (groupId: string, ingId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          ingredients: g.ingredients.filter((ing) => ing.id !== ingId),
        };
      }),
    );
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    if (!useIngredientGroups) {
      if (active.id !== over.id) {
        setIngredients((items) => {
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    } else {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Final sorting commit
      const activeGroupIndex = groups.findIndex((g) => g.id === activeId);
      if (activeGroupIndex !== -1) {
        const overGroupIndex = groups.findIndex((g) => g.id === overId);
        if (overGroupIndex !== -1 && activeGroupIndex !== overGroupIndex) {
          setGroups((gs) => arrayMove(gs, activeGroupIndex, overGroupIndex));
        }
        return;
      }
      // Ingredients reordering is handled by handleDragOver in real-time
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!useIngredientGroups) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging group
    if (groups.some(g => g.id === activeId)) {
      // Real-time group sorting
      const activeIndex = groups.findIndex(g => g.id === activeId);
      const overIndex = groups.findIndex(g => g.id === overId);
      if (overIndex !== -1 && activeIndex !== overIndex) {
        setGroups(gs => arrayMove(gs, activeIndex, overIndex));
      }
      return;
    }

    // Dragging ingredient
    const activeG = groups.find((g) => g.ingredients.some((i) => i.id === activeId));
    const overG = groups.find((g) => g.id === overId || g.ingredients.some((i) => i.id === overId));

    if (!activeG || !overG) return;

    if (activeG.id === overG.id) {
      // Intra-group reorder
      const oldIndex = activeG.ingredients.findIndex((i) => i.id === activeId);
      const newIndex = overG.ingredients.findIndex((i) => i.id === overId);
      if (oldIndex !== newIndex && newIndex !== -1) {
        setGroups(gs => gs.map(g => {
          if (g.id === activeG.id) {
            return { ...g, ingredients: arrayMove(g.ingredients, oldIndex, newIndex) };
          }
          return g;
        }));
      }
    } else {
      // Inter-group move
      setGroups((gs) => {
        const activeIng = activeG.ingredients.find((i) => i.id === activeId)!;
        return gs.map((g) => {
          if (g.id === activeG.id) {
            return {
              ...g,
              ingredients: g.ingredients.filter((i) => i.id !== activeId),
            };
          }
          if (g.id === overG.id) {
            const overIndex = g.ingredients.findIndex((i) => i.id === overId);
            const newIndex = overIndex >= 0 ? overIndex : g.ingredients.length;
            return {
              ...g,
              ingredients: [
                ...g.ingredients.slice(0, newIndex),
                { ...activeIng, group: g.name },
                ...g.ingredients.slice(newIndex),
              ],
            };
          }
          return g;
        });
      });
    }
  };

  // Direction Handlers
  const addDirection = () => {
    setDirections([...directions, ""]);
  };
  const updateDirection = (index: number, value: string) => {
    const newDirections = [...directions];
    newDirections[index] = value;
    setDirections(newDirections);
  };
  const removeDirection = (index: number) => {
    setDirections(directions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let finalIngredients: Ingredient[] = [];
    if (useIngredientGroups) {
      if (groups.some((g) => g.ingredients.some((ing) => ing.name.trim() !== "" && !g.name.trim()))) {
        setError("When using groups, all ingredients must belong to a group.");
        setLoading(false);
        return;
      }
      finalIngredients = groups.flatMap((g) =>
        g.ingredients
          .filter((i) => i.name.trim() !== "")
          .map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            metric_amount: ing.metric_amount,
            metric_unit: ing.metric_unit,
            group: g.name,
          })),
      );
    } else {
      finalIngredients = ingredients
        .filter((i) => i.name.trim() !== "")
        .map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          metric_amount: ing.metric_amount,
          metric_unit: ing.metric_unit,
          group: "",
        }));
    }

    const recipeData = {
      title,
      description,
      photo_url: photoUrl,
      servings: Number(servings),
      tags,
      ingredients: finalIngredients,
      use_ingredient_groups: useIngredientGroups,
      directions: directions.filter((d) => d.trim() !== ""),
      notes,
      source_url: sourceUrl,
    };

    try {
      const url = isEditing
        ? `/api/recipes/${initialData?.id}`
        : "/api/recipes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipeData),
      });

      if (!res.ok) throw new Error("Failed to save recipe");

      const data = await res.json();
      router.push(`/recipes/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-20">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b dark:border-zinc-800 pb-2 text-gray-900 dark:text-gray-100">
          Basic Information
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title*
          </label>
          <input
            type="text"
            required
            className="mt-1 w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            className="mt-1 w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Photo
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-gray-50 dark:file:bg-zinc-800 file:text-gray-700 dark:file:text-gray-300
                  hover:file:bg-gray-100 dark:hover:file:bg-zinc-700
                  cursor-pointer disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">or URL</span>
                <input
                  type="url"
                  className="flex-1 border dark:border-zinc-800 rounded-md px-3 py-1 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {isUploading && (
                <div className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                  Uploading image...
                </div>
              )}
              {photoUrl && (
                <div className="relative w-full h-32 mt-2 group">
                  <img
                    src={photoUrl}
                    alt="Recipe preview"
                    className="w-full h-full object-cover rounded-md border dark:border-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base Servings*
            </label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b dark:border-zinc-800 pb-2 text-gray-900 dark:text-gray-100">Tags</h2>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              className="w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              value={newTag}
              onChange={(e) => handleNewTagChange(e.target.value)}
              onFocus={() => setIsTagInputFocused(true)}
              onBlur={() => setTimeout(() => setIsTagInputFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedSuggestionIndex((prev) =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : prev));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (
                    highlightedSuggestionIndex >= 0 &&
                    highlightedSuggestionIndex < filteredSuggestions.length
                  ) {
                    addTag(filteredSuggestions[highlightedSuggestionIndex]);
                  } else {
                    addTag();
                  }
                }
              }}
              placeholder="Add a tag (e.g. Dinner, Spicy)"
            />
            {isTagInputFocused && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsContainerRef}
                className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-md shadow-lg max-h-[110px] overflow-y-auto"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      index === highlightedSuggestionIndex 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                    onClick={() => addTag(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => addTag()}
            className="bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const styles = getTagStyles(tag);
            return (
              <span
                key={tag}
                className={cn(
                  "px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium border transition-colors",
                  styles.bg,
                  styles.text,
                  styles.border,
                  "dark:bg-opacity-10 dark:border-opacity-30"
                )}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70 font-bold transition-opacity"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b dark:border-zinc-800 pb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ingredients</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useIngredientGroups}
              onChange={(e) => handleToggleGroups(e.target.checked)}
              className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900"
            />
            Use Groups
          </label>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          {useIngredientGroups ? (
            <div className="space-y-6">
              <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    onUpdateName={(name) => updateGroupName(group.id, name)}
                    onRemove={() => removeGroup(group.id)}
                    onAddIngredient={() => addIngredientToGroup(group.id)}
                    onUpdateIngredient={(ingId, field, value) =>
                      updateGroupIngredient(group.id, ingId, field, value)
                    }
                    onRemoveIngredient={(ingId) =>
                      removeGroupIngredient(group.id, ingId)
                    }
                  >
                    <SortableContext
                      items={group.ingredients.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {group.ingredients.map((ing) => (
                        <SortableIngredientRow
                          key={ing.id}
                          ingredient={ing}
                          onUpdate={(field, value) =>
                            updateGroupIngredient(group.id, ing.id, field, value)
                          }
                          onRemove={() =>
                            removeGroupIngredient(group.id, ing.id)
                          }
                        />
                      ))}
                    </SortableContext>
                  </SortableGroup>
                ))}
              </SortableContext>
              <button
                type="button"
                onClick={addGroup}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                + Add Ingredient Group
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:flex gap-2 mb-2 text-sm font-medium text-gray-500 pl-8">
                <div className="w-20">Qty</div>
                <div className="w-24">Unit</div>
                <div className="w-36">Amount (g/ml)</div>
                <div className="flex-grow">Ingredient Name</div>
                <div className="w-10"></div>
              </div>
              <SortableContext
                items={ingredients.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {ingredients.map((ing) => (
                    <SortableIngredientRow
                      key={ing.id}
                      ingredient={ing}
                      onUpdate={(field, value) =>
                        updateIngredient(ing.id, field, value)
                      }
                      onRemove={() => removeIngredient(ing.id)}
                    />
                  ))}
                </div>
              </SortableContext>
              <button
                type="button"
                onClick={addIngredient}
                className="text-blue-600 font-medium hover:underline pl-8"
              >
                + Add Ingredient
              </button>
            </div>
          )}

          <DragOverlay adjustScale={false}>
            {activeId ? (
              activeGroup ? (
                <GroupContainer group={activeGroup} isOverlay>
                  <div className="space-y-3">
                    {activeGroup.ingredients.map((ing) => (
                      <IngredientRow key={ing.id} ingredient={ing} />
                    ))}
                  </div>
                </GroupContainer>
              ) : activeIngredient ? (
                <IngredientRow ingredient={activeIngredient} isOverlay />
              ) : null
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      {/* Directions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b dark:border-zinc-800 pb-2 text-gray-900 dark:text-gray-100">Directions</h2>
        <div className="space-y-3">
          {directions.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="mt-2 font-medium text-gray-500 dark:text-gray-400 w-6">
                {index + 1}.
              </span>
              <textarea
                className="flex-grow border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                rows={2}
                value={step}
                onChange={(e) => updateDirection(index, e.target.value)}
                placeholder="What to do next..."
              />
              <button
                type="button"
                onClick={() => removeDirection(index)}
                className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDirection}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          + Add Step
        </button>
      </section>

      {/* Notes & Source */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b dark:border-zinc-800 pb-2 text-gray-900 dark:text-gray-100">Notes & Source</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            className="mt-1 w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Extra tips, substitutions..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Source URL
          </label>
          <input
            type="url"
            className="mt-1 w-full border dark:border-zinc-800 rounded-md px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Link to original recipe"
          />
        </div>
      </section>

      <div className="pt-6 flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex-grow transition-colors"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Recipe"
              : "Create Recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border dark:border-zinc-800 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

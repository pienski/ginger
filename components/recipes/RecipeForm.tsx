"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ingredient, Recipe } from "@/lib/db/schema";

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  isEditing?: boolean;
}

export default function RecipeForm({
  initialData,
  isEditing = false,
}: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || "");
  const [servings, setServings] = useState(initialData?.servings || 2);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [useIngredientGroups, setUseIngredientGroups] = useState(
    initialData?.use_ingredient_groups || false,
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients?.map((ing) => ({
      ...ing,
      metric_amount: ing.metric_amount ?? null,
      metric_unit: ing.metric_unit ?? "g",
      group: ing.group || "",
    })) || [
      { name: "", amount: 1, unit: "", metric_amount: null, metric_unit: "g", group: "" },
    ],
  );
  const [directions, setDirections] = useState<string[]>(
    initialData?.directions || [""],
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url || "");

  // Tag Handlers
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Ingredient Handlers
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", amount: 1, unit: "", metric_amount: null, metric_unit: "g", group: "" },
    ]);
  };
  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string | number | null,
  ) => {
    const newIngredients = [...ingredients];
    const val =
      (field === "amount" || field === "metric_amount") && value !== ""
        ? Number(value)
        : value;
    newIngredients[index] = { ...newIngredients[index], [field]: val };
    setIngredients(newIngredients);
  };
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
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

    if (useIngredientGroups && ingredients.some((ing) => ing.name.trim() !== "" && !ing.group?.trim())) {
      setError("When using groups, all ingredients must belong to a group.");
      setLoading(false);
      return;
    }

    const recipeData = {
      title,
      description,
      photo_url: photoUrl,
      servings: Number(servings),
      tags,
      ingredients: ingredients.filter((i) => i.name.trim() !== ""),
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
        <h2 className="text-xl font-semibold border-b pb-2">
          Basic Information
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title*
          </label>
          <input
            type="text"
            required
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="mt-1 w-full border rounded-md px-3 py-2"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photo URL
            </label>
            <input
              type="url"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Base Servings*
            </label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Tags</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-grow border rounded-md px-3 py-2"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag (e.g. Dinner, Spicy)"
          />
          <button
            type="button"
            onClick={addTag}
            className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900 font-bold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b pb-2">
          <h2 className="text-xl font-semibold">Ingredients</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useIngredientGroups}
              onChange={(e) => setUseIngredientGroups(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Use Groups
          </label>
        </div>
        <div className="hidden md:flex gap-2 mb-2 text-sm font-medium text-gray-500">
          <div className="w-20">Qty</div>
          <div className="w-24">Unit</div>
          <div className="w-36">Amount (g/ml)</div>
          <div className="flex-grow">Ingredient Name</div>
          {useIngredientGroups && <div className="w-32">Group</div>}
          <div className="w-10"></div>
        </div>
        <div className="space-y-3">
          {ingredients.map((ing, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="number"
                step="any"
                placeholder="Qty"
                className="w-20 border rounded-md px-3 py-2"
                value={ing.amount}
                onChange={(e) =>
                  updateIngredient(index, "amount", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Unit"
                className="w-24 border rounded-md px-3 py-2"
                value={ing.unit || ""}
                onChange={(e) =>
                  updateIngredient(index, "unit", e.target.value)
                }
              />
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  placeholder="Metric"
                  className="w-24 border rounded-md px-3 py-2"
                  value={ing.metric_amount || ""}
                  onChange={(e) =>
                    updateIngredient(index, "metric_amount", e.target.value)
                  }
                />
                <select
                  className="border rounded-md px-1 py-2 bg-white text-sm"
                  value={ing.metric_unit || "g"}
                  onChange={(e) =>
                    updateIngredient(index, "metric_unit", e.target.value)
                  }
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Ingredient name"
                className="flex-grow border rounded-md px-3 py-2"
                value={ing.name}
                onChange={(e) =>
                  updateIngredient(index, "name", e.target.value)
                }
              />
              {useIngredientGroups && (
                <input
                  type="text"
                  placeholder="Group (e.g. Sauce)"
                  className="w-32 border rounded-md px-3 py-2"
                  value={ing.group || ""}
                  onChange={(e) =>
                    updateIngredient(index, "group", e.target.value)
                  }
                />
              )}
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-500 p-2 hover:bg-red-50 rounded"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="text-blue-600 font-medium hover:underline"
        >
          + Add Ingredient
        </button>
      </section>

      {/* Directions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Directions</h2>
        <div className="space-y-3">
          {directions.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="mt-2 font-medium text-gray-500 w-6">
                {index + 1}.
              </span>
              <textarea
                className="flex-grow border rounded-md px-3 py-2"
                rows={2}
                value={step}
                onChange={(e) => updateDirection(index, e.target.value)}
                placeholder="What to do next..."
              />
              <button
                type="button"
                onClick={() => removeDirection(index)}
                className="text-red-500 p-2 hover:bg-red-50 rounded"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDirection}
          className="text-blue-600 font-medium hover:underline"
        >
          + Add Step
        </button>
      </section>

      {/* Notes & Source */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Notes & Source</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            className="mt-1 w-full border rounded-md px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Extra tips, substitutions..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source URL
          </label>
          <input
            type="url"
            className="mt-1 w-full border rounded-md px-3 py-2"
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
          className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 flex-grow"
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
          className="px-8 py-3 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

import RecipeForm from "@/components/recipes/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Recipe</h1>
        <p className="text-gray-500 mt-2">
          Enter the details manually or use the LLM import (coming soon).
        </p>
      </div>
      <RecipeForm />
    </div>
  );
}

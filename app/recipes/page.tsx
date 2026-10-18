import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RecipeList from "@/components/recipes/RecipeList";
import AddRecipeDropdown from "@/components/recipes/AddRecipeDropdown";
import { getRecipes, getAllTags, SortOption } from "@/lib/actions/recipes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipes",
};

export const dynamic = "force-dynamic";

interface RecipesPageProps {
  searchParams?: Promise<{
    search?: string;
    tags?: string;
    sortBy?: string;
    onlyOurs?: string;
  }>;
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolved = searchParams ? await searchParams : {};
  const search = resolved.search || "";
  const rawTags = resolved.tags;
  const tags = rawTags
    ? rawTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const sortBy: SortOption =
    resolved.sortBy === "recently_cooked" || resolved.sortBy === "alphabetical"
      ? resolved.sortBy
      : "recently_added";
  const onlyOurs = resolved.onlyOurs === "true";

  const categories = process.env.CATEGORIES 
    ? process.env.CATEGORIES.split(',').map(c => c.trim()).filter(Boolean) 
    : [];

  const [initialRecipes, allTags] = await Promise.all([
    getRecipes({
      limit: 15,
      search,
      tags,
      sortBy,
      includeOtherFamilies: !onlyOurs,
    }),
    getAllTags(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <AddRecipeDropdown />
      </div>

      <RecipeList 
        initialRecipes={initialRecipes} 
        categories={categories} 
        serverTags={allTags}
        initialFilters={{
          search,
          tags,
          sortBy,
          onlyOurs,
        }}
      />
    </div>
  );
}

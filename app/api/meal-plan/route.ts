import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { mealPlan, recipes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getCategories(): string[] {
  return process.env.CATEGORIES
    ? process.env.CATEGORIES.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
}

// Upsert the recipe assigned to a (date, category) slot. One recipe per cell.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { date, category, recipe_id } = await request.json();

    if (!date || !DATE_RE.test(date)) {
      return new NextResponse("Invalid or missing date", { status: 400 });
    }
    if (!category || !getCategories().includes(category)) {
      return new NextResponse("Invalid or missing category", { status: 400 });
    }
    if (!recipe_id) {
      return new NextResponse("Missing recipe_id", { status: 400 });
    }

    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipe_id),
      columns: { id: true, title: true, photo_url: true, photo_position: true },
    });
    if (!recipe) {
      return new NextResponse("Recipe not found", { status: 400 });
    }

    await db
      .insert(mealPlan)
      .values({ date, category, recipe_id })
      .onConflictDoUpdate({
        target: [mealPlan.date, mealPlan.category],
        set: { recipe_id },
      });

    // Return the joined shape the calendar cell needs for an optimistic update.
    return NextResponse.json({
      date,
      category,
      recipe_id,
      title: recipe.title,
      photo_url: recipe.photo_url,
      photo_position: recipe.photo_position,
    });
  } catch (error) {
    console.error("Failed to save meal plan slot:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Clear a (date, category) slot.
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const category = searchParams.get("category");

    if (!date || !DATE_RE.test(date) || !category) {
      return new NextResponse("Invalid or missing date/category", { status: 400 });
    }

    await db
      .delete(mealPlan)
      .where(and(eq(mealPlan.date, date), eq(mealPlan.category, category)));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete meal plan slot:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

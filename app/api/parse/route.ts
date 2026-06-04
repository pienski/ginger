import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseRecipe } from "@/lib/llm/parseRecipe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return new NextResponse("Text is required", { status: 400 });
    }

    const recipe = await parseRecipe(text);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Failed to parse recipe:", error);
    return new NextResponse("Failed to parse recipe", { status: 500 });
  }
}

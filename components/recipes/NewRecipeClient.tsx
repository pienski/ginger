"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import RecipeForm from "./RecipeForm";
import { Recipe } from "@/lib/db/schema";
import { Loader2, Sparkles } from "lucide-react";

interface NewRecipeClientProps {
  existingTags: string[];
}

export default function NewRecipeClient({ existingTags }: NewRecipeClientProps) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "import" ? "import" : "manual";
  
  const [mode, setMode] = useState<"import" | "manual">(initialMode);
  const [importText, setImportText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Recipe> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!importText.trim()) return;
    
    setIsParsing(true);
    setError(null);
    
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to parse recipe. Please try again or use manual entry.");
      }
      
      const data = await res.json();
      setParsedData(data);
      setMode("manual");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsParsing(false);
    }
  };

  if (mode === "import") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Import Recipe with AI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Paste any unstructured recipe text (e.g. from a blog, OCR, or notes) and our AI will structure it for you.
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <textarea
            className="w-full h-96 border dark:border-zinc-800 rounded-lg p-4 font-mono text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Paste your recipe text here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            disabled={isParsing}
          />
          
          <div className="flex gap-4">
            <button
              onClick={handleParse}
              disabled={isParsing || !importText.trim()}
              className="flex-grow bg-blue-600 dark:bg-blue-700 text-white px-8 py-4 rounded-md font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isParsing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Parsing Recipe...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Parse Recipe
                </>
              )}
            </button>
            <button
              onClick={() => setMode("manual")}
              disabled={isParsing}
              className="px-8 py-4 border dark:border-zinc-800 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancel & Use Manual Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {parsedData ? "Review Parsed Recipe" : "Add New Recipe"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {parsedData 
              ? "We've filled in the details for you. Please review and make any necessary adjustments before saving."
              : "Enter the details manually below."}
          </p>
        </div>
        {!parsedData && (
          <button 
            onClick={() => setMode("import")}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mb-1"
          >
            <Sparkles size={16} />
            Use AI Import instead
          </button>
        )}
      </div>
      <RecipeForm 
        key={parsedData ? "parsed" : "manual"} 
        initialData={parsedData || undefined} 
        existingTags={existingTags} 
      />
    </div>
  );
}

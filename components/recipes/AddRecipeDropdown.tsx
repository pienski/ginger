"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, FileText, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AddRecipeDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2",
          isOpen && "rounded-b-none"
        )}
      >
        <Plus size={18} />
        Add Recipe
        <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden rounded-tr-none">
          <Link
            href="/recipes/new?mode=import"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={16} className="text-blue-500" />
            Paste Text (AI)
          </Link>
          <Link
            href="/recipes/new?mode=manual"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors"
          >
            <Keyboard size={16} className="text-gray-400" />
            Manual Form
          </Link>
        </div>
      )}
    </div>
  );
}

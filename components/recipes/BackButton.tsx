"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadRecipeListState, buildRecipeQueryString } from "@/lib/recipe-session";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackHref = "/recipes",
  label = "Back to recipes",
  className = "inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-6 cursor-pointer",
}: BackButtonProps) {
  const router = useRouter();

  const getTargetHref = () => {
    const cached = loadRecipeListState();
    if (cached) {
      const qs = buildRecipeQueryString({
        search: cached.search,
        tags: cached.selectedTags,
        sortBy: cached.sortBy,
        onlyOurs: cached.onlyOurs,
      });
      return `/recipes${qs}`;
    }
    return fallbackHref;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If not a middle-click or cmd/ctrl click, navigate directly to target recipes list
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      const target = getTargetHref();
      router.push(target);
    }
  };

  return (
    <a
      href={fallbackHref}
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </a>
  );
}

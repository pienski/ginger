"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  recipeId: string;
  recipeTitle: string;
}

export default function DeleteButton({ recipeId, recipeTitle }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${recipeTitle}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/recipes");
        router.refresh();
      } else {
        alert("Failed to delete recipe");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the recipe");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
    >
      {isDeleting ? "Deleting..." : "Delete Recipe"}
    </button>
  );
}

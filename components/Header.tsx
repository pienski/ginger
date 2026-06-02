"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/recipes" className="text-xl font-bold text-blue-600">
          Recipe App
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/recipes" className="text-gray-600 hover:text-blue-600 transition-colors">
            Recipes
          </Link>
          <Link href="/history" className="text-gray-600 hover:text-blue-600 transition-colors">
            History
          </Link>
          <Link href="/grocery" className="text-gray-600 hover:text-blue-600 transition-colors">
            Groceries
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

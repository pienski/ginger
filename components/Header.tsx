"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!session) return null;

  const navLinks = [
    { href: "/recipes", label: "Recipes" },
    { href: "/history", label: "History" },
    { href: "/grocery", label: "Groceries" },
  ];

  const appName = process.env.APP_NAME || "Recipe App";

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 transition-colors duration-300 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link 
          href="/recipes" 
          className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate whitespace-nowrap min-w-0"
          title={appName}
        >
          {appName}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
          >
            Sign out
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
        isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
      )}>
        <nav className="flex flex-col p-4 gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-left font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

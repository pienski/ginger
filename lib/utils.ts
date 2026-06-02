import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  if (amount === 0.5) return "½";
  if (amount === 0.25) return "¼";
  if (amount === 0.75) return "¾";
  if (amount === 0.33) return "⅓";
  if (amount === 0.66) return "⅔";
  
  // Round to 2 significant figures
  return Number(amount.toPrecision(2)).toString();
}

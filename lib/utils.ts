import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  if (amount === 0) return "0";

  // Fractions for amounts < 1
  if (amount < 1) {
    if (Math.abs(amount - 0.25) < 0.01) return "¼";
    if (Math.abs(amount - 0.5) < 0.01) return "½";
    if (Math.abs(amount - 0.75) < 0.01) return "¾";
    if (Math.abs(amount - 0.33) < 0.02) return "⅓";
    if (Math.abs(amount - 0.66) < 0.02) return "⅔";
  }

  // Round to 1 decimal place
  return (Math.round(amount * 10) / 10).toString();
}

export function formatMetricAmount(amount: number, unit: "g" | "ml" | string | null): string {
  if (!amount || amount === 0) return "";
  
  if (amount >= 1000) {
    const kgL = amount / 1000;
    const finalUnit = unit === "ml" ? "L" : "kg";
    // Show 1 decimal place if not a whole number (e.g., 1.2kg), otherwise whole (e.g., 1kg)
    const formattedValue = kgL % 1 === 0 ? kgL.toString() : (Math.round(kgL * 10) / 10).toString();
    return `${formattedValue}${finalUnit}`;
  }
  
  return `${Math.round(amount)}${unit || "g"}`;
}

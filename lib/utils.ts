import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  if (amount === 0) return "0";

  const whole = Math.floor(amount);
  const remainder = amount - whole;
  let fraction = "";

  if (Math.abs(remainder - 0.25) < 0.01) fraction = "¼";
  else if (Math.abs(remainder - 0.5) < 0.01) fraction = "½";
  else if (Math.abs(remainder - 0.75) < 0.01) fraction = "¾";
  else if (Math.abs(remainder - 0.33) < 0.02) fraction = "⅓";
  else if (Math.abs(remainder - 0.66) < 0.02) fraction = "⅔";

  if (fraction) {
    return whole > 0 ? `${whole}${fraction}` : fraction;
  }

  if (remainder < 0.01) return whole.toString();

  // Round to 1 decimal place if no fraction match
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

const tagStyles = [
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-emerald-600", text: "text-emerald-50", border: "border-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-blue-600", text: "text-blue-50", border: "border-blue-700" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-orange-600", text: "text-orange-50", border: "border-orange-700" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-purple-600", text: "text-purple-50", border: "border-purple-700" },
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-rose-600", text: "text-rose-50", border: "border-rose-700" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-amber-600", text: "text-amber-50", border: "border-amber-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  { bg: "bg-indigo-600", text: "text-indigo-50", border: "border-indigo-700" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
  { bg: "bg-teal-600", text: "text-teal-50", border: "border-teal-700" },
  { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-300" },
  { bg: "bg-slate-600", text: "text-slate-50", border: "border-slate-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  { bg: "bg-cyan-600", text: "text-cyan-50", border: "border-cyan-700" },
];

export function getTagStyles(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagStyles.length;
  return tagStyles[index];
}

export const PREDEFINED_UNITS = [
  { singular: "tsp", plural: "tsp" },
  { singular: "Tbsp", plural: "Tbsp" },
  { singular: "cup", plural: "cups" },
  { singular: "piece", plural: "pieces" },
  { singular: "can", plural: "cans" },
  { singular: "jar", plural: "jars" },
  { singular: "handful", plural: "handfuls" },
  { singular: "pkg", plural: "pkg" },
  { singular: "clove", plural: "cloves" },
  { singular: "pinch", plural: "pinches" },
  { singular: "slice", plural: "slices" },
];

export function getPluralizedUnit(unit: string | null, amount: number): string | null {
  if (!unit) return null;
  
  const unitObj = PREDEFINED_UNITS.find(
    (u) => u.singular.toLowerCase() === unit.toLowerCase() || u.plural.toLowerCase() === unit.toLowerCase()
  );
  
  if (!unitObj) return unit;

  // Rule: plural if amount > 1 or in decimals (0 < amount < 1)
  const isPlural = amount > 1 || (amount > 0 && amount < 1);
  
  return isPlural ? unitObj.plural : unitObj.singular;
}

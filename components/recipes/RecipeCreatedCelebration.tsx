"use client";

import { useMemo } from "react";
import { Check, Sparkles } from "lucide-react";
import spriteSheet from "@/app/assets/sprite_sheet.webp";

interface RecipeCreatedCelebrationProps {
  title?: string;
}

// Blue-forward palette to match the app's accent colour, with restrained accents
const CONFETTI_COLORS = [
  "#2563eb", // blue-600 (primary accent)
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#0ea5e9", // sky-500
  "#6366f1", // indigo-500
  "#22c55e", // green-500 (echoes the success check)
  "#94a3b8", // slate-400 (neutral)
];

// Deterministic-ish pseudo random so SSR/CSR match isn't a concern (client-only render)
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function RecipeCreatedCelebration({
  title,
}: RecipeCreatedCelebrationProps) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => {
        const left = rand(0, 100);
        const size = rand(7, 14);
        const drift = rand(-25, 25); // horizontal drift in vw
        const duration = rand(2.2, 3.8);
        const delay = rand(0, 0.6);
        const rotate = rand(360, 1080);
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const isCircle = i % 3 === 0;
        return { left, size, drift, duration, delay, rotate, color, isCircle, id: i };
      }),
    [],
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = rand(70, 120);
        return {
          id: i,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          delay: rand(0, 0.9),
          size: rand(14, 24),
        };
      }),
    [],
  );

  return (
    <div
      className="celebration-backdrop fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md"
      role="alertdialog"
      aria-label="Recipe created"
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="celebration-confetti absolute -top-6"
            style={
              {
                left: `${c.left}%`,
                width: `${c.size}px`,
                height: `${c.size * (c.isCircle ? 1 : 1.5)}px`,
                backgroundColor: c.color,
                borderRadius: c.isCircle ? "9999px" : "2px",
                "--cx": `${c.drift}vw`,
                "--cr": `${c.rotate}deg`,
                "--cd": `${c.duration}s`,
                "--cdelay": `${c.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Badge with glow, pulse rings and orbiting sparkles */}
      <div className="relative flex items-center justify-center">
        {/* Soft radial glow */}
        <div className="celebration-glow absolute h-56 w-56 rounded-full bg-gradient-to-tr from-blue-400 via-sky-400 to-indigo-400 blur-3xl" />

        {/* Expanding pulse rings */}
        <div className="celebration-ring absolute h-28 w-28 rounded-full border-2 border-blue-400/60" />
        <div
          className="celebration-ring absolute h-28 w-28 rounded-full border-2 border-sky-400/50"
          style={{ animationDelay: "0.55s" }}
        />

        {/* Orbiting sparkles */}
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="celebration-sparkle absolute text-blue-400 dark:text-blue-300"
            style={
              {
                transform: `translate(${s.x}px, ${s.y}px)`,
                "--sdelay": `${s.delay}s`,
              } as React.CSSProperties
            }
          >
            <Sparkles size={s.size} fill="currentColor" strokeWidth={1} />
          </span>
        ))}

        {/* The check badge */}
        <div className="celebration-badge relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/40 ring-8 ring-white/70 dark:ring-white/10">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path className="celebration-check" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="relative mt-12 flex flex-col items-center px-6 text-center">
        <h2 className="celebration-title text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          Recipe Created!
        </h2>
        <p className="celebration-subtitle mt-3 flex items-start justify-center gap-2 text-lg font-medium text-gray-600 dark:text-gray-300">
          {title ? (
            <>
              <Check size={18} className="mt-1.5 flex-shrink-0 text-green-500" />
              <span className="max-w-sm sm:max-w-md">
                &ldquo;{title}&rdquo; is in your cookbook
              </span>
            </>
          ) : (
            "Added to your cookbook"
          )}
        </p>
      </div>

      {/* Chef cat jumping up from the bottom of the page (sprite-sheet animation) */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
        <div className="celebration-cat">
          <div
            className="celebration-cat-sprite w-80 h-80 sm:w-[28rem] sm:h-[28rem] select-none"
            style={{
              backgroundImage: `url(${spriteSheet.src})`,
              // Each frame leaves ~25% transparent space below the cat's feet;
              // nudge down so the feet rest at the bottom edge of the page and the
              // jump visibly lifts off it.
              transform: "translateY(25%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, FileText } from "lucide-react";

interface CopyMarkdownButtonProps {
  markdown: string;
}

export default function CopyMarkdownButton({ markdown }: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy recipe markdown:", err);
    }
  };

  return (
    <button
      onClick={copy}
      title="Copy this recipe as Markdown"
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

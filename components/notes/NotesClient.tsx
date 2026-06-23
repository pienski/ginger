"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import NoteEditor from "./NoteEditor";

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  updated_at: string | Date;
};

interface NotesClientProps {
  initialNotes: NoteItem[];
}

const DISCARD_MESSAGE = "You have unsaved changes. Discard them?";

export default function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Tracks the editor's unsaved state without re-rendering. Used to guard note
  // switches, creation, mobile back, and full page unloads.
  const dirtyRef = useRef(false);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const confirmDiscard = () => !dirtyRef.current || window.confirm(DISCARD_MESSAGE);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleSelect = (id: string) => {
    if (id === selectedId) return;
    if (!confirmDiscard()) return;
    dirtyRef.current = false;
    setSelectedId(id);
  };

  const handleNew = async () => {
    if (!confirmDiscard()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/notes", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create note");
      const note: NoteItem = await res.json();
      dirtyRef.current = false;
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    } catch (err) {
      console.error(err);
      alert("Could not create note. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaved = useCallback((updated: NoteItem) => {
    dirtyRef.current = false;
    // Move the saved note to the top so the list stays "most recently edited first".
    setNotes((prev) => [updated, ...prev.filter((n) => n.id !== updated.id)]);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    dirtyRef.current = false;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId(null);
  }, []);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const handleBack = () => {
    if (!confirmDiscard()) return;
    dirtyRef.current = false;
    setSelectedId(null);
  };

  return (
    <div className="flex border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm h-[calc(100vh-13rem)] min-h-[28rem]">
      {/* Left: note list */}
      <div
        className={cn(
          "flex-col w-full md:w-72 md:shrink-0 md:border-r border-gray-200 dark:border-zinc-800",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
          <button
            onClick={handleNew}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Plus size={18} />
            New note
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
              No notes yet. Create your first one.
            </p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => handleSelect(note.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-gray-100 dark:border-zinc-800 truncate transition-colors",
                  note.id === selectedId
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                )}
              >
                {note.title?.trim() || "Untitled"}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: editor */}
      <div
        className={cn(
          "flex-1 min-w-0",
          selectedId ? "flex" : "hidden md:flex"
        )}
      >
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onDirtyChange={handleDirtyChange}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 p-8 text-center">
            Select a note or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}

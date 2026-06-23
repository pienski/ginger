"use client";

import { useEffect, useReducer, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteItem } from "./NotesClient";

interface NoteEditorProps {
  note: NoteItem;
  onSaved: (note: NoteItem) => void;
  onDeleted: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBack: () => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "p-2 rounded-md transition-colors disabled:opacity-40",
        active
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
      )}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({
  note,
  onSaved,
  onDeleted,
  onDirtyChange,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [html, setHtml] = useState(note.content);
  const [saving, setSaving] = useState(false);
  // Re-render on selection changes so toolbar active states stay in sync.
  const [, forceRender] = useReducer((x) => x + 1, 0);

  // The last persisted values for this note. NotesClient remounts the editor
  // (key={note.id}) when the note changes, so this initializes fresh per note.
  const [saved, setSaved] = useState({ title: note.title, content: note.content });

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: note.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "note-editor px-4 py-4 min-h-full focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    onSelectionUpdate: () => forceRender(),
  });

  // Derived during render; after a save we sync `saved` + title/html so this
  // recomputes to false without an extra state update.
  const isDirty = title !== saved.title || html !== saved.content;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSave = async () => {
    if (!editor || saving) return;
    setSaving(true);
    try {
      const content = editor.getHTML();
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const updated: NoteItem = await res.json();
      setSaved({ title: updated.title, content: updated.content });
      setTitle(updated.title);
      setHtml(updated.content);
      onSaved(updated);
    } catch (err) {
      console.error(err);
      alert("Could not save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      onDeleted(note.id);
    } catch (err) {
      console.error(err);
      alert("Could not delete note. Please try again.");
      setSaving(false);
    }
  };

  const setLink = (editor: Editor) => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header: back (mobile) + title + actions */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-zinc-800">
        <button
          onClick={onBack}
          aria-label="Back to notes"
          className="md:hidden p-2 -ml-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="flex-1 min-w-0 text-lg font-semibold bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          aria-label="Delete note"
          title="Delete note"
          className="p-2 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 dark:border-zinc-800 flex-wrap">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          disabled={!editor}
          label="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          disabled={!editor}
          label="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive("heading", { level: 2 })}
          disabled={!editor}
          label="Heading"
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          disabled={!editor}
          label="Bullet list"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive("orderedList")}
          disabled={!editor}
          label="Numbered list"
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor && setLink(editor)}
          active={editor?.isActive("link")}
          disabled={!editor}
          label="Link"
        >
          <Link2 size={18} />
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}

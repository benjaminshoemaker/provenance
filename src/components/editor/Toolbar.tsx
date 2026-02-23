"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Clock,
  Eye,
  EyeOff,
  Sparkle,
  PanelLeftClose,
  ChevronDown,
  MoreHorizontal,
  Strikethrough,
  Code,
  CodeSquare,
  Unlink,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
  onHistoryClick?: () => void;
  showLens?: boolean;
  onLensToggle?: () => void;
  chatOpen?: boolean;
  onChatToggle?: () => void;
  editorOpen?: boolean;
  onEditorCollapse?: () => void;
}

function ToolbarDropdown({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-background p-1 shadow-md"
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

export function Toolbar({ editor, onHistoryClick, showLens, onLensToggle, chatOpen, onChatToggle, editorOpen, onEditorCollapse }: ToolbarProps) {
  if (!editor) return null;

  const activeHeading = editor.isActive("heading", { level: 1 })
    ? "H1"
    : editor.isActive("heading", { level: 2 })
      ? "H2"
      : editor.isActive("heading", { level: 3 })
        ? "H3"
        : null;

  return (
    <div className="flex min-h-12 box-border items-center gap-1 overflow-x-auto border-b border-border bg-muted px-2 py-1.5">
      {/* Primary formatting tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          aria-label="Bold"
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          aria-label="Italic"
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px self-stretch bg-border" />

        {/* Heading dropdown */}
        <ToolbarDropdown
          trigger={
            <Button
              variant={activeHeading ? "secondary" : "ghost"}
              size="sm"
              type="button"
              title="Headings"
              className="flex items-center gap-1 text-xs"
            >
              {activeHeading ?? "H"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          }
        >
          <Button
            variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            type="button"
          >
            <Heading1 className="h-4 w-4" /> Heading 1
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            type="button"
          >
            <Heading2 className="h-4 w-4" /> Heading 2
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            type="button"
          >
            <Heading3 className="h-4 w-4" /> Heading 3
          </Button>
        </ToolbarDropdown>

        <div className="mx-1 w-px self-stretch bg-border" />

        {/* Lists */}
        <Button
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          aria-label="Bullet List"
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
          aria-label="Ordered List"
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          aria-label="Blockquote"
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px self-stretch bg-border" />

        {/* Link */}
        <Button
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Link"
          aria-label="Link"
          type="button"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Overflow menu for less-used items */}
        <ToolbarDropdown
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              title="More formatting"
              aria-label="More formatting"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        >
          <Button
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            type="button"
          >
            <Strikethrough className="h-4 w-4" /> Strikethrough
          </Button>
          <Button
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleCode().run()}
            type="button"
          >
            <Code className="h-4 w-4" /> Inline Code
          </Button>
          <Button
            variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            type="button"
          >
            <CodeSquare className="h-4 w-4" /> Code Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().unsetLink().run()}
            type="button"
          >
            <Unlink className="h-4 w-4" /> Remove Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => {
              const url = window.prompt("Enter image URL");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            type="button"
          >
            <ImageIcon className="h-4 w-4" /> Image
          </Button>
          <div className="my-1 h-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().undo().run()}
            type="button"
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" /> Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => editor.chain().focus().redo().run()}
            type="button"
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" /> Redo
          </Button>
        </ToolbarDropdown>
      </div>

      {/* Right-aligned tools */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <div className="mx-1 w-px self-stretch bg-border" />

        {/* Provenance lens toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={showLens ? "secondary" : "ghost"}
            size="sm"
            onClick={onLensToggle}
            title="Toggle provenance highlights (⌘⇧H)"
            type="button"
            aria-pressed={showLens}
            className="flex items-center gap-1.5 text-xs"
          >
            {showLens ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Provenance
          </Button>
          {showLens && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
                AI
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
                Pasted
              </span>
            </div>
          )}
        </div>

        <div className="mx-1 w-px self-stretch bg-border" />

        {/* History button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onHistoryClick}
          title="History"
          type="button"
        >
          <Clock className="h-4 w-4" />
        </Button>

        {/* Editor collapse button */}
        {onEditorCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEditorCollapse}
            title="Collapse editor"
            aria-label="Collapse editor"
            type="button"
            disabled={editorOpen === true && !chatOpen}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}

        {/* AI panel toggle — only shown when panel is collapsed */}
        {!chatOpen && (
          <>
            <div className="mx-1 w-px self-stretch bg-border" />
            <Button
              variant="outline"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onChatToggle}
              title="Toggle AI panel (⌘L)"
              type="button"
              className="flex items-center gap-2 text-xs"
            >
              <Sparkle className="h-3.5 w-3.5" />
              <span>AI</span>
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘L
              </kbd>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

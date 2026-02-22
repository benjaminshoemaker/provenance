"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  CodeSquare,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  ImageIcon,
  Undo,
  Redo,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
  onHistoryClick?: () => void;
  showLens?: boolean;
  onLensToggle?: () => void;
  chatOpen?: boolean;
  onChatToggle?: () => void;
}

export function Toolbar({ editor, onHistoryClick, showLens, onLensToggle, chatOpen, onChatToggle }: ToolbarProps) {
  if (!editor) return null;

  const items = [
    {
      icon: Bold,
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      icon: Italic,
      title: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      icon: Strikethrough,
      title: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      icon: Code,
      title: "Inline Code",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive("code"),
    },
    { type: "divider" as const },
    {
      icon: Heading1,
      title: "Heading 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      title: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      title: "Heading 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
    { type: "divider" as const },
    {
      icon: Quote,
      title: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
    {
      icon: CodeSquare,
      title: "Code Block",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive("codeBlock"),
    },
    {
      icon: List,
      title: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      title: "Ordered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    { type: "divider" as const },
    {
      icon: LinkIcon,
      title: "Link",
      action: () => {
        const url = window.prompt("Enter URL");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
      isActive: () => editor.isActive("link"),
    },
    {
      icon: Unlink,
      title: "Remove Link",
      action: () => editor.chain().focus().unsetLink().run(),
      isActive: () => false,
    },
    {
      icon: ImageIcon,
      title: "Image",
      action: () => {
        const url = window.prompt("Enter image URL");
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
      isActive: () => false,
    },
    { type: "divider" as const },
    {
      icon: Undo,
      title: "Undo",
      action: () => editor.chain().focus().undo().run(),
      isActive: () => false,
    },
    {
      icon: Redo,
      title: "Redo",
      action: () => editor.chain().focus().redo().run(),
      isActive: () => false,
    },
  ];

  return (
    <div className="flex min-h-12 items-center gap-1 overflow-x-auto p-2">
      {/* Formatting tools */}
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => {
          if ("type" in item && item.type === "divider") {
            return (
              <div
                key={`divider-${index}`}
                className="mx-1 w-px self-stretch bg-border"
              />
            );
          }

          const { icon: Icon, title, action, isActive } = item as {
            icon: React.ComponentType<{ className?: string }>;
            title: string;
            action: () => void;
            isActive: () => boolean;
          };

          return (
            <Button
              key={title}
              variant={isActive() ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={action}
              title={title}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
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

        <div className="mx-1 w-px self-stretch bg-border" />

        {/* AI panel toggle */}
        <Button
          variant={chatOpen ? "secondary" : "outline"}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onChatToggle}
          title="Toggle AI panel (⌘L)"
          type="button"
          aria-pressed={chatOpen}
          className="flex items-center gap-2 text-xs"
        >
          <span className="flex items-center gap-1">
            {chatOpen ? "" : "+"}
            <span>AI</span>
          </span>
          <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
            ⌘L
          </kbd>
        </Button>
      </div>
    </div>
  );
}

import type { Editor } from "@tiptap/react";

export interface TriggerPosition {
  top: number;
  left: number;
  right: number;
}

export function resolveTriggerPosition(params: {
  editor: Editor;
  main: HTMLElement;
  proseArea: HTMLDivElement | null;
  position?: number;
}): TriggerPosition {
  const { editor, main, proseArea, position } = params;
  const mainRect = main.getBoundingClientRect();
  const proseRect = proseArea?.getBoundingClientRect();

  const iconSize = 32;
  const fallbackWidth = main.clientWidth || 1200;
  const fallbackHeight = main.clientHeight || 800;
  const targetPosition = Math.max(1, position ?? editor.state.selection.from);
  const cursorCoords = editor.view.coordsAtPos(targetPosition);

  const minTop = 56;
  const maxTop = Math.max(minTop, fallbackHeight - iconSize - 8);
  const top = Math.min(
    maxTop,
    Math.max(minTop, cursorCoords.top - mainRect.top - 4)
  );

  const rightMarginAnchor = proseRect?.right
    ? proseRect.right - mainRect.left + 8
    : fallbackWidth - iconSize - 12;
  const left = Math.min(
    fallbackWidth - iconSize - 8,
    Math.max(8, rightMarginAnchor)
  );
  const right = Math.max(8, fallbackWidth - left - iconSize);

  return { top, left, right };
}

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

type ActivationGesture = Pick<MouseEvent, "metaKey" | "ctrlKey">;

export interface EditorInteractionPolicyOptions {
  interactiveSelectors: readonly string[];
  isExplicitActivationGesture: (event: ActivationGesture) => boolean;
}

export const editorInteractionPolicyKey = new PluginKey("editorInteractionPolicy");
export const DEFAULT_INTERACTIVE_SELECTORS = [
  "a[href]",
  "[data-editor-interactive='true']",
] as const;

export function isExplicitActivationGesture(
  event: ActivationGesture
): boolean {
  return event.metaKey || event.ctrlKey;
}

export function buildInteractiveSelector(selectors: readonly string[]): string {
  return selectors
    .map((selector) => selector.trim())
    .filter(Boolean)
    .join(",");
}

function resolveEventTargetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

export function shouldSuppressInteractiveClick({
  target,
  interactiveSelector,
  event,
  isEditable,
  isExplicitActivationGesture: allowActivation,
}: {
  target: EventTarget | null;
  interactiveSelector: string;
  event: ActivationGesture;
  isEditable: boolean;
  isExplicitActivationGesture: (event: ActivationGesture) => boolean;
}): boolean {
  if (!isEditable || !interactiveSelector) return false;
  const targetElement = resolveEventTargetElement(target);
  if (!targetElement) return false;

  const interactiveTarget = targetElement.closest(interactiveSelector);
  if (!interactiveTarget) return false;

  return !allowActivation(event);
}

export const EditorInteractionPolicy = Extension.create<EditorInteractionPolicyOptions>(
  {
    name: "editorInteractionPolicy",

    addOptions() {
      return {
        interactiveSelectors: DEFAULT_INTERACTIVE_SELECTORS,
        isExplicitActivationGesture,
      };
    },

    addProseMirrorPlugins() {
      const interactiveSelector = buildInteractiveSelector(
        this.options.interactiveSelectors
      );
      const allowActivation = this.options.isExplicitActivationGesture;

      return [
        new Plugin({
          key: editorInteractionPolicyKey,
          props: {
            handleDOMEvents: {
              click(view, event) {
                if (!(event instanceof MouseEvent)) return false;

                const shouldSuppress = shouldSuppressInteractiveClick({
                  target: event.target,
                  interactiveSelector,
                  event,
                  isEditable: view.editable,
                  isExplicitActivationGesture: allowActivation,
                });

                if (!shouldSuppress) return false;
                event.preventDefault();
                // Let ProseMirror continue processing the click so caret/selection still works.
                return false;
              },
            },
          },
        }),
      ];
    },
  }
);

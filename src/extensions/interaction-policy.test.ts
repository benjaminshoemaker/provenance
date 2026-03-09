import { describe, it, expect, afterEach, vi } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  EditorInteractionPolicy,
  buildInteractiveSelector,
  isExplicitActivationGesture,
  shouldSuppressInteractiveClick,
} from "./interaction-policy";

describe("interaction policy helpers", () => {
  it("should treat cmd/ctrl click as explicit activation", () => {
    expect(isExplicitActivationGesture({ metaKey: true, ctrlKey: false })).toBe(
      true
    );
    expect(isExplicitActivationGesture({ metaKey: false, ctrlKey: true })).toBe(
      true
    );
    expect(
      isExplicitActivationGesture({ metaKey: false, ctrlKey: false })
    ).toBe(false);
  });

  it("should build a comma-separated selector list from configured selectors", () => {
    expect(
      buildInteractiveSelector(["a[href]", "  ", "[data-editor-interactive='true']"])
    ).toBe("a[href],[data-editor-interactive='true']");
  });

  it("should suppress plain click for configured interactive targets", () => {
    const target = document.createElement("a");
    target.href = "https://example.com";

    const suppress = shouldSuppressInteractiveClick({
      target,
      interactiveSelector: "a[href]",
      event: { metaKey: false, ctrlKey: false },
      isEditable: true,
      isExplicitActivationGesture,
    });

    expect(suppress).toBe(true);
  });

  it("should suppress plain click when event target is text inside an interactive element", () => {
    const link = document.createElement("a");
    link.href = "https://example.com";
    const textNode = document.createTextNode("Example link");
    link.appendChild(textNode);

    const suppress = shouldSuppressInteractiveClick({
      target: textNode,
      interactiveSelector: "a[href]",
      event: { metaKey: false, ctrlKey: false },
      isEditable: true,
      isExplicitActivationGesture,
    });

    expect(suppress).toBe(true);
  });

  it("should allow explicit activation gestures for interactive targets", () => {
    const target = document.createElement("a");
    target.href = "https://example.com";

    const suppress = shouldSuppressInteractiveClick({
      target,
      interactiveSelector: "a[href]",
      event: { metaKey: true, ctrlKey: false },
      isEditable: true,
      isExplicitActivationGesture,
    });

    expect(suppress).toBe(false);
  });
});

describe("EditorInteractionPolicy extension", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function getClickHandler(instance: Editor) {
    const plugin = instance.state.plugins.find(
      (candidate) =>
        typeof candidate.props.handleDOMEvents?.click === "function"
    );
    return {
      plugin,
      clickHandler: plugin?.props.handleDOMEvents?.click,
    };
  }

  function createClickEvent(
    target: Node,
    options?: { metaKey?: boolean; ctrlKey?: boolean }
  ) {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      metaKey: options?.metaKey,
      ctrlKey: options?.ctrlKey,
    });
    Object.defineProperty(event, "target", { value: target });
    return event;
  }

  it("should suppress plain link clicks while editing", () => {
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [StarterKit, EditorInteractionPolicy],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Example",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
        ],
      },
    });

    const { plugin, clickHandler } = getClickHandler(editor);
    expect(clickHandler).toBeTypeOf("function");

    const link = document.createElement("a");
    link.href = "https://example.com";
    const event = createClickEvent(link);
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    const handled = clickHandler?.call(
      plugin!,
      editor.view,
      event as unknown as PointerEvent
    );
    expect(handled).toBe(false);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  it("should allow explicit link activation gestures while editing", () => {
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [StarterKit, EditorInteractionPolicy],
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Example" }] }],
      },
    });

    const { plugin, clickHandler } = getClickHandler(editor);
    expect(clickHandler).toBeTypeOf("function");

    const link = document.createElement("a");
    link.href = "https://example.com";
    const event = createClickEvent(link, { metaKey: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    const handled = clickHandler?.call(
      plugin!,
      editor.view,
      event as unknown as PointerEvent
    );
    expect(handled).toBe(false);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should suppress plain clicks for custom interactive elements", () => {
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [StarterKit, EditorInteractionPolicy],
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Test" }] }],
      },
    });

    const { plugin, clickHandler } = getClickHandler(editor);
    expect(clickHandler).toBeTypeOf("function");

    const interactive = document.createElement("span");
    interactive.setAttribute("data-editor-interactive", "true");
    const event = createClickEvent(interactive);
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    const handled = clickHandler?.call(
      plugin!,
      editor.view,
      event as unknown as PointerEvent
    );
    expect(handled).toBe(false);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });
});

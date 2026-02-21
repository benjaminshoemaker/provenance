import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelState } from "./usePanelState";

const STORAGE_KEY = "provenance-panel-state";

describe("usePanelState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with provided defaults", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    expect(result.current.isPanelOpen("editor")).toBe(true);
    expect(result.current.isPanelOpen("ai-chat")).toBe(false);
  });

  it("should toggle panel state", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    act(() => result.current.togglePanel("editor"));
    expect(result.current.isPanelOpen("editor")).toBe(false);

    act(() => result.current.togglePanel("editor"));
    expect(result.current.isPanelOpen("editor")).toBe(true);
  });

  it("should set panel open state explicitly", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    act(() => result.current.setPanelOpen("ai-chat", true));
    expect(result.current.isPanelOpen("ai-chat")).toBe(true);

    act(() => result.current.setPanelOpen("ai-chat", false));
    expect(result.current.isPanelOpen("ai-chat")).toBe(false);
  });

  it("should no-op when setting same value", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true } })
    );

    const panelsBefore = result.current.panels;
    act(() => result.current.setPanelOpen("editor", true));
    expect(result.current.panels).toBe(panelsBefore);
  });

  it("should no-op toggle for unknown panel id", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true } })
    );

    const panelsBefore = result.current.panels;
    act(() => result.current.togglePanel("unknown"));
    expect(result.current.panels).toBe(panelsBefore);
  });

  it("should persist to localStorage on change", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    act(() => result.current.togglePanel("ai-chat"));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual({ editor: true, "ai-chat": true });
  });

  it("should restore from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ editor: false, "ai-chat": true })
    );

    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    // After hydration effect runs
    expect(result.current.isPanelOpen("editor")).toBe(false);
    expect(result.current.isPanelOpen("ai-chat")).toBe(true);
  });

  it("should handle corrupted localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    expect(result.current.isPanelOpen("editor")).toBe(true);
    expect(result.current.isPanelOpen("ai-chat")).toBe(false);
  });

  it("should ignore non-boolean values in stored data", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ editor: "yes", "ai-chat": 42 })
    );

    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true, "ai-chat": false } })
    );

    expect(result.current.isPanelOpen("editor")).toBe(true);
    expect(result.current.isPanelOpen("ai-chat")).toBe(false);
  });

  it("should return false for unknown panel ids in isPanelOpen", () => {
    const { result } = renderHook(() =>
      usePanelState({ defaults: { editor: true } })
    );

    expect(result.current.isPanelOpen("nonexistent")).toBe(false);
  });
});

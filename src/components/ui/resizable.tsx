"use client"

import { ChevronLeft, ChevronRight, GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

interface ExtendedHandleProps {
  onCollapseToggle?: () => void
  collapseDirection?: "left" | "right"
  isCollapsed?: boolean
  collapseLabel?: string
}

function getChevronIcon(params: {
  collapseDirection?: "left" | "right"
  isCollapsed?: boolean
}) {
  const { collapseDirection, isCollapsed } = params
  if (collapseDirection === "right") {
    return isCollapsed ? ChevronLeft : ChevronRight
  }
  return isCollapsed ? ChevronRight : ChevronLeft
}

function getCollapseButtonClassName(params: {
  withHandle?: boolean
  isCollapsed?: boolean
}) {
  const base =
    "absolute z-20 flex h-6 w-6 items-center justify-center rounded-sm border bg-background shadow-xs opacity-0 transition-opacity duration-150 group-hover/handle:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (params.withHandle && !params.isCollapsed) {
    return `${base} -translate-y-6`
  }

  return base
}

function shouldRenderHandleGrip(withHandle?: boolean, isCollapsed?: boolean) {
  return Boolean(withHandle && !isCollapsed)
}

function ResizableHandle({
  withHandle,
  className,
  onCollapseToggle,
  collapseDirection,
  isCollapsed,
  collapseLabel,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
} & ExtendedHandleProps) {
  const ChevronIcon = getChevronIcon({ collapseDirection, isCollapsed })
  const actionLabel = isCollapsed ? "Expand" : "Collapse"
  const renderHandleGrip = shouldRenderHandleGrip(withHandle, isCollapsed)
  const collapseButtonClassName = getCollapseButtonClassName({
    withHandle,
    isCollapsed,
  })

  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      disabled={isCollapsed}
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px shrink-0 self-stretch items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
        onCollapseToggle && "group/handle",
        isCollapsed && "cursor-default",
        className
      )}
      {...props}
    >
      {renderHandleGrip && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
      {onCollapseToggle && (
        <button
          type="button"
          className={collapseButtonClassName}
          aria-label={`${actionLabel} ${collapseLabel || "panel"}`}
          aria-expanded={!isCollapsed}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.stopPropagation()
            onCollapseToggle()
          }}
        >
          <ChevronIcon className="h-4 w-4" />
        </button>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }

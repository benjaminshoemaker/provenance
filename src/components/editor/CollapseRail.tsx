"use client";

interface CollapseRailProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
}

export function CollapseRail({ label, shortcut, onClick }: CollapseRailProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Expand ${label} panel`}
      className="flex h-full w-full cursor-pointer items-center justify-center bg-gray-50 transition-colors hover:bg-muted"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span
        className="select-none text-xs font-medium text-muted-foreground"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {label}
        {shortcut && (
          <>
            {"  "}
            {shortcut}
          </>
        )}
      </span>
    </div>
  );
}

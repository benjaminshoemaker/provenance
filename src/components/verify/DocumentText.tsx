"use client";

import { useState } from "react";

interface DocumentTextProps {
  title: string;
  text: string;
}

const COLLAPSED_LENGTH = 2000;

export function DocumentText({ title, text }: DocumentTextProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > COLLAPSED_LENGTH;
  const displayText =
    isLong && !expanded ? text.slice(0, COLLAPSED_LENGTH) + "..." : text;

  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
          {displayText}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            {expanded ? "Show less" : "Expand full document"}
          </button>
        )}
      </div>
    </div>
  );
}

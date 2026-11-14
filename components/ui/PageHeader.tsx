import React from "react";

interface PageHeaderProps {
  title: string;
  arcadeLabel?: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  arcadeLabel,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between gap-4 pb-5 border-b"
      style={{ borderColor: "#2a2a2a" }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {arcadeLabel && (
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#555",
            }}
          >
            {arcadeLabel}
          </span>
        )}
        <h1
          className="text-xl font-bold tracking-tight leading-none"
          style={{ color: "#f0f0f0" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: "#888" }}>
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

import React from "react";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      {/* Icon container */}
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: 56,
          height: 56,
          background: "#1e1e1e",
          border: "1px solid #2a2a2a",
        }}
      >
        <Icon size={24} style={{ color: "#555" }} />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            color: "#888",
          }}
        >
          {title}
        </span>

        {description && (
          <p className="text-sm max-w-xs" style={{ color: "#555" }}>
            {description}
          </p>
        )}
      </div>

      {/* Optional action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

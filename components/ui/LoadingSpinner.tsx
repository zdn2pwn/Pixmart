import React from "react";

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
}

export default function LoadingSpinner({
  text = "LOADING DATA...",
  size = 24,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      {/* Spinner */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid #2a2a2a`,
          borderTopColor: "#22c55e",
          animation: "spin 0.8s linear infinite",
        }}
      />

      <span
        className="text-[9px] tracking-widest"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          color: "#555",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        {text}
      </span>

      {/* Inline keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

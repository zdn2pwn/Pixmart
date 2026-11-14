"use client";

import React, { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  variant = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmBg = variant === "danger" ? "#7f1d1d" : "#166534";
  const confirmHoverBg = variant === "danger" ? "#ef4444" : "#22c55e";
  const confirmColor = "#f0f0f0";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onCancel}
      >
        {/* Dialog box */}
        <div
          className="relative w-full max-w-sm rounded-lg border p-6 flex flex-col gap-4"
          style={{ background: "#161616", borderColor: "#2a2a2a" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arcade label */}
          <div
            className="text-[9px] tracking-widest uppercase"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: variant === "danger" ? "#ef4444" : "#22c55e",
            }}
          >
            {variant === "danger" ? "⚠ DANGER ZONE" : "CONFIRM ACTION"}
          </div>

          {/* Title */}
          <h2
            className="text-base font-bold leading-snug"
            style={{ color: "#f0f0f0" }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p className="text-sm" style={{ color: "#888" }}>
              {description}
            </p>
          )}

          {/* Divider */}
          <div
            className="w-full"
            style={{ height: 1, background: "#2a2a2a" }}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded text-sm font-mono border transition-colors"
              style={{
                background: "transparent",
                borderColor: "#2a2a2a",
                color: "#888",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
                (e.currentTarget as HTMLButtonElement).style.color = "#888";
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded text-sm font-mono font-semibold border transition-colors"
              style={{
                background: confirmBg,
                borderColor: "transparent",
                color: confirmColor,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = confirmHoverBg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = confirmBg;
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

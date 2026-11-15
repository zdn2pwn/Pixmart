"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type AlertType = "success" | "error" | "info" | "confirm";

interface AlertState {
  show: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

let globalSetAlert: ((state: AlertState) => void) | null = null;

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    globalSetAlert = setAlert;
    return () => {
      globalSetAlert = null;
    };
  }, []);

  function handleClose() {
    if (alert.onCancel) {
      alert.onCancel();
    }
    setAlert({ ...alert, show: false });
  }

  function handleConfirm() {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    setAlert({ ...alert, show: false });
  }

  if (!alert.show) return <>{children}</>;

  const icons = {
    success: <CheckCircle2 size={48} className="text-[#39FF14]" />,
    error: <AlertCircle size={48} className="text-[#FF4444]" />,
    info: <Info size={48} className="text-[#FFB800]" />,
    confirm: <AlertCircle size={48} className="text-[#FFB800]" />,
  };

  const titleColors = {
    success: "text-[#39FF14]",
    error: "text-[#FF4444]",
    info: "text-[#FFB800]",
    confirm: "text-[#FFB800]",
  };

  return (
    <>
      {children}
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
        {/* Modal */}
        <div className="bg-[#0a0a0a] border-2 border-[#39FF14] max-w-md w-full animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="border-b border-[#222] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icons[alert.type]}
              <h3 className={`text-lg font-bold ${titleColors[alert.type]}`}>
                {alert.title}
              </h3>
            </div>
            {alert.type !== "confirm" && (
              <button
                onClick={handleClose}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-white text-sm leading-relaxed">{alert.message}</p>
          </div>

          {/* Footer */}
          <div className="border-t border-[#222] px-6 py-4 flex gap-3 justify-end">
            {alert.type === "confirm" ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#333] hover:bg-[#444] text-white text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-[#39FF14] hover:bg-[#2ECC11] text-black text-sm font-bold transition-colors"
                >
                  Konfirmasi
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-8 py-2.5 bg-[#39FF14] hover:bg-[#2ECC11] text-black text-sm font-bold transition-colors"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper functions (global API)
export const customAlert = {
  success: (message: string, title = "Berhasil!") => {
    if (globalSetAlert) {
      globalSetAlert({
        show: true,
        type: "success",
        title,
        message,
      });
    }
  },

  error: (message: string, title = "Error!") => {
    if (globalSetAlert) {
      globalSetAlert({
        show: true,
        type: "error",
        title,
        message,
      });
    }
  },

  info: (message: string, title = "Info") => {
    if (globalSetAlert) {
      globalSetAlert({
        show: true,
        type: "info",
        title,
        message,
      });
    }
  },

  confirm: (message: string, onConfirm: () => void, title = "Konfirmasi") => {
    if (globalSetAlert) {
      globalSetAlert({
        show: true,
        type: "confirm",
        title,
        message,
        onConfirm,
        onCancel: () => {},
      });
    }
  },
};

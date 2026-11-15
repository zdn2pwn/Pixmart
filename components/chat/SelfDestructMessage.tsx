"use client";

import { useState, useEffect } from "react";
import { Flame, Eye, Clock, AlertTriangle } from "lucide-react";

interface SelfDestructMessageProps {
  message: any;
  isOwnMessage: boolean;
  onRead: (messageId: string) => void;
  onDestruct: (messageId: string) => void;
}

export function SelfDestructMessage({
  message,
  isOwnMessage,
  onRead,
  onDestruct,
}: SelfDestructMessageProps) {
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isDestroying, setIsDestroying] = useState(false);

  const isUnread = !message.read_at && !isOwnMessage;
  const isDeleted = message.is_deleted;
  const isReading =
    hasStartedReading || Boolean(isOwnMessage && message.read_at);

  const handleStartReading = () => {
    if (isOwnMessage || isDeleted) return;

    setHasStartedReading(true);
    onRead(message.id);
  };

  useEffect(() => {
    if (!isReading || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsDestroying(true);
          setTimeout(() => {
            onDestruct(message.id);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReading, countdown, message.id, onDestruct]);

  if (isDeleted) {
    return (
      <div className="flex items-center gap-2 border-2 border-line bg-panel/60 p-3 text-[13px] italic text-muted-ink">
        <Flame size={14} className="shrink-0 text-amber" />
        <span>Pesan sudah hilang. Jejaknya cuma di sini.</span>
      </div>
    );
  }

  if (isUnread && !isReading) {
    return (
      <button
        type="button"
        onClick={handleStartReading}
        className="group relative w-full cursor-pointer border-2 border-amber/50 bg-amber/[0.07] p-4 text-left transition-colors hover:border-amber hover:bg-amber/10"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative grid size-8 place-items-center border-2 border-amber/60 bg-ink text-amber">
              <Eye size={15} />
              <span className="absolute -right-1 -top-1 size-2 bg-amber arcade-blink" />
            </span>
            <span className="font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-amber">
              Pesan baru · tap untuk baca
            </span>
          </div>
          <Flame
            size={15}
            className="shrink-0 text-amber/50 transition-colors group-hover:text-amber"
          />
        </div>
        <div className="mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-muted-ink">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber" />
          Pesan hilang otomatis 10 detik setelah dibuka.
        </div>
      </button>
    );
  }

  return (
    <div
      className={`relative border-2 p-3.5 transition-all duration-1000 ${
        isDestroying
          ? "scale-95 opacity-0 blur-sm"
          : "scale-100 opacity-100"
      } ${
        isOwnMessage
          ? "ml-auto border-lime/40 bg-lime/[0.07]"
          : "border-amber/40 bg-amber/[0.06]"
      }`}
    >
      {isReading && (
        <div
          className={`absolute -top-3 right-2 flex items-center gap-1 border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold text-ink ${
            isOwnMessage ? "bg-lime" : "bg-amber"
          }`}
        >
          <Clock size={10} />
          <span>{countdown}s</span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-ink">
          <span className="font-bold uppercase tracking-[0.08em]">
            {isOwnMessage ? "Kamu" : message.sender_role}
          </span>
          {isOwnMessage && message.read_at && (
            <span className="flex items-center gap-1 text-lime">
              <Eye size={10} />
              Dibaca {isReading && "· menghilang"}
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-cream">
          {message.content}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[10px] text-muted-ink/80">
          <span>
            {new Date(message.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isReading && (
            <span
              className={`flex items-center gap-1 ${
                isOwnMessage ? "text-lime" : "text-amber"
              }`}
            >
              <Flame size={10} />
              Auto-hapus aktif
            </span>
          )}
        </div>
      </div>

      {isReading && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 overflow-hidden ${
            isOwnMessage ? "bg-lime/20" : "bg-amber/20"
          }`}
        >
          <div
            className={`h-full ${
              isOwnMessage ? "bg-lime" : "bg-amber"
            }`}
            style={{
              width: `${(countdown / 10) * 100}%`,
              transition: "width 1s linear",
            }}
          />
        </div>
      )}
    </div>
  );
}

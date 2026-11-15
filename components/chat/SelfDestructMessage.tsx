"use client";

import { useState, useEffect } from "react";
import { Flame, Eye, Clock } from "lucide-react";

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
  const [countdown, setCountdown] = useState(10); // 10 seconds to read
  const [isDestroying, setIsDestroying] = useState(false);

  const isUnread = !message.read_at && !isOwnMessage;
  const isDeleted = message.is_deleted;

  // The sender's countdown starts automatically once the recipient has read it.
  const isReading = hasStartedReading || Boolean(isOwnMessage && message.read_at);

  // Handle reading message (only recipient can trigger)
  const handleStartReading = () => {
    if (isOwnMessage || isDeleted) return;
    
    setHasStartedReading(true);
    onRead(message.id);
  };

  // Countdown timer after reading (for BOTH sender and recipient)
  useEffect(() => {
    if (!isReading || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Start destruction animation
          setIsDestroying(true);
          setTimeout(() => {
            onDestruct(message.id);
          }, 1000); // Wait for animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReading, countdown, message.id, onDestruct]);

  // If message is deleted, show placeholder
  if (isDeleted) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[#1a1a1a]/50 border border-[#333]/30 rounded text-[#666] text-xs italic">
        <Flame size={12} className="text-[#FF6600]" />
        <span>Pesan telah dihapus (self-destruct)</span>
      </div>
    );
  }

  // Unread message - show "Tap to reveal"
  if (isUnread && !isReading) {
    return (
      <button
        onClick={handleStartReading}
        className="group relative p-4 bg-gradient-to-r from-[#FF6600]/10 to-[#FF3B30]/10 border border-[#FF6600]/30 rounded hover:border-[#FF6600] transition-all cursor-pointer w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Eye size={16} className="text-[#FF6600]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6600] rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-mono text-[#FF6600] font-bold">
              Pesan Baru (Tap untuk Baca)
            </span>
          </div>
          <Flame size={14} className="text-[#FF6600]/50 group-hover:text-[#FF6600] transition-colors" />
        </div>
        <div className="text-xs text-[#888] mt-1 font-mono">
          ⚠️ Pesan akan hilang otomatis setelah dibaca
        </div>
      </button>
    );
  }

  // Reading mode with countdown (BOTH sender & recipient see this after read)
  return (
    <div
      className={`relative p-3 rounded transition-all duration-1000 ${
        isDestroying
          ? "opacity-0 scale-95 blur-sm"
          : "opacity-100 scale-100"
      } ${
        isOwnMessage
          ? "bg-[#39FF14]/10 border border-[#39FF14]/30 ml-auto"
          : "bg-[#FF6600]/10 border border-[#FF6600]/30"
      }`}
    >
      {/* Countdown timer (VISIBLE FOR BOTH) */}
      {isReading && (
        <div className={`absolute -top-3 right-2 flex items-center gap-1 px-2 py-0.5 ${
          isOwnMessage ? 'bg-[#39FF14]' : 'bg-[#FF6600]'
        } text-black text-xs font-bold rounded-full animate-pulse`}>
          <Clock size={10} />
          <span>{countdown}s</span>
        </div>
      )}

      {/* Message content */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-[#888]">
          <span className="font-mono">
            {isOwnMessage ? "Kamu" : message.sender_role}
          </span>
          {isOwnMessage && message.read_at && (
            <span className="text-[#39FF14] flex items-center gap-1 animate-pulse">
              <Eye size={10} />
              Dibaca {isReading && "→ Menghilang..."}
            </span>
          )}
        </div>
        <p className="text-sm text-white whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className="flex items-center justify-between text-[10px] text-[#666] font-mono pt-1">
          <span>{new Date(message.created_at).toLocaleTimeString("id-ID")}</span>
          {isReading && (
            <span className={`flex items-center gap-1 ${
              isOwnMessage ? 'text-[#39FF14]' : 'text-[#FF6600]'
            }`}>
              <Flame size={10} />
              Auto-hapus aktif
            </span>
          )}
        </div>
      </div>

      {/* Destruction progress bar (VISIBLE FOR BOTH) */}
      {isReading && (
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b overflow-hidden ${
          isOwnMessage ? 'bg-[#39FF14]/20' : 'bg-[#FF6600]/20'
        }`}>
          <div
            className={`h-full transition-all ${
              isOwnMessage ? 'bg-[#39FF14]' : 'bg-[#FF6600]'
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

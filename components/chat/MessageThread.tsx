"use client";

import { useState, useRef, useTransition } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { SelfDestructMessage } from "./SelfDestructMessage";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
  read_at?: string | null;
  read_by?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<{ success?: boolean; error?: string }>;
  onMarkAsRead?: (messageId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  placeholder?: string;
  emptyStateText?: string;
  enableSelfDestruct?: boolean;
}

export function MessageThread({
  messages,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  onDeleteMessage,
  placeholder = "Ketik pesan Anda...",
  emptyStateText = "Belum ada pesan. Mulai percakapan!",
  enableSelfDestruct = true,
}: MessageThreadProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content || isPending) return;

    setError(null);
    const optimisticMessage = messageInput;
    setMessageInput("");

    startTransition(async () => {
      const result = await onSendMessage(content);
      
      if (result.error) {
        setError(result.error);
        setMessageInput(optimisticMessage); // Restore message on error
      }
    });
  }

  async function handleReadMessage(messageId: string) {
    if (onMarkAsRead) {
      await onMarkAsRead(messageId);
    }
  }

  async function handleDestructMessage(messageId: string) {
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0c0c0c]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-[#666] text-xs font-mono">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
            <p>{emptyStateText}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isSystem = msg.sender_role === "SYSTEM";

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <div className="inline-block bg-[#1a1a1a] border border-[#333] px-3 py-1.5 text-[10px] font-mono text-[#39FF14]">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Use SelfDestructMessage if enabled
            if (enableSelfDestruct) {
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`w-full max-w-[75%]`}>
                    <SelfDestructMessage
                      message={msg}
                      isOwnMessage={isMe}
                      onRead={handleReadMessage}
                      onDestruct={handleDestructMessage}
                    />
                  </div>
                </div>
              );
            }

            // Fallback: Regular message display
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 text-xs ${
                    isMe
                      ? "bg-[#39FF14] text-black"
                      : "bg-[#1a1a1a] border border-[#333] text-white"
                  }`}
                >
                  <div className="break-words">{msg.content}</div>
                </div>
                <div className="text-[9px] font-mono text-[#666] mt-0.5">
                  {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-950/40 border-t border-red-500/50 text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-[#222] bg-[#111] p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={placeholder}
            disabled={isPending}
            className="flex-1 bg-[#1a1a1a] border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#39FF14] placeholder:text-[#666] disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isPending}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Kirim...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Kirim</span>
              </>
            )}
          </button>
        </div>
        <div className="text-[9px] font-mono text-[#666] mt-1.5">
          {messageInput.length}/500 karakter
        </div>
      </form>
    </div>
  );
}

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
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-ink p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="grid size-14 place-items-center border-2 border-line bg-panel text-muted-ink">
              <MessageSquare size={24} />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-ink">
              {emptyStateText}
            </p>
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-line">
              Ruang obrolan demo
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isSystem = msg.sender_role === "SYSTEM";

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <div className="inline-block max-w-[92%] border-2 border-line bg-panel px-3 py-2 font-mono text-xs leading-relaxed text-lime">
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
                  className={`max-w-[80%] border-2 px-3.5 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "border-lime bg-lime text-ink"
                      : "border-line bg-panel text-cream"
                  }`}
                >
                  <div className="break-words">{msg.content}</div>
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-ink">
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
        <div className="border-t-2 border-red-500/40 bg-red-950/30 px-4 py-2 font-mono text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t-2 border-line bg-surface p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={placeholder}
            disabled={isPending}
            className="min-w-0 flex-1 border-2 border-line bg-panel px-3 py-2.5 text-sm text-cream placeholder:text-muted-ink/55 focus:border-lime focus:outline-none disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isPending}
            className="btn-primary shrink-0 !min-h-11 !px-4 !py-2.5 !text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="mt-1.5 font-mono text-[10px] text-muted-ink/70">
          {messageInput.length}/500 karakter
        </div>
      </form>
    </div>
  );
}

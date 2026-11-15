"use client";

import { useState } from "react";
import { MessageThread } from "@/components/chat/MessageThread";

const seed = [
  {
    id: "m1",
    sender_id: "seller-1",
    sender_role: "SELLER",
    content:
      "Headphone masih mulus, box dan pouch lengkap. Bisa cek langsung di lokasi.",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    is_deleted: false,
  },
  {
    id: "m2",
    sender_id: "buyer-1",
    sender_role: "BUYER",
    content: "Oke, aku setuju ketemu jam 3 sore di Grand Indonesia.",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read_at: null,
    is_deleted: false,
  },
  {
    id: "m3",
    sender_id: "buyer-1",
    sender_role: "SYSTEM",
    content: "Titik temu dikunci: Starbucks Grand Indonesia Lt. 3, 15:30.",
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    read_at: null,
    is_deleted: false,
  },
];

export default function PreviewChatPage() {
  const [messages, setMessages] = useState(seed);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="pixel-panel flex h-[680px] flex-col overflow-hidden">
        <div className="border-b-2 border-line bg-ink px-4 py-3">
          <h1 className="text-sm font-bold text-cream">Preview chat</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-ink">
            Bubble · system · self destruct
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <MessageThread
            messages={messages}
            currentUserId="buyer-1"
            onSendMessage={async (content) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `local-${Date.now()}`,
                  sender_id: "buyer-1",
                  sender_role: "BUYER",
                  content,
                  created_at: new Date().toISOString(),
                  read_at: null,
                  is_deleted: false,
                },
              ]);
              return { success: true };
            }}
            placeholder="Tulis pesan untuk lawan nego..."
            emptyStateText="Belum ada pesan."
          />
        </div>
      </div>
    </main>
  );
}

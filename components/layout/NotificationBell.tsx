"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getNotificationsAction, markAllNotificationsReadAction } from "@/app/actions/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await getNotificationsAction();
    setItems(res.notifications || []);
    setUnread(res.unread || 0);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleMarkAll() {
    await markAllNotificationsReadAction();
    load();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex items-center justify-center py-1 text-muted-ink transition-colors hover:text-lime"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-pink font-mono text-[9px] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-3 w-72 border-2 border-ink bg-[#fffbf2] text-ink shadow-[5px_5px_0_0_#3a3157]">
            <div className="flex items-center justify-between border-b-2 border-ink/10 px-4 py-2.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/40 hover:text-ink"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center font-mono text-[11px] text-ink/40">
                  No notifications yet.
                </div>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-ink/10 px-4 py-2.5 transition-colors hover:bg-lime/10 ${
                      n.read_at ? "opacity-60" : ""
                    }`}
                  >
                    <div className="text-[12px] font-bold text-ink">{n.title}</div>
                    {n.body && (
                      <div className="mt-0.5 text-[11px] text-ink/60">{n.body}</div>
                    )}
                    <div className="mt-1 font-mono text-[9px] text-ink/40">
                      {new Date(n.created_at).toLocaleString("id-ID")}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
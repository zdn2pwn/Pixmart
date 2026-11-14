import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { OwnerDashboardContent } from "./OwnerDashboardContent";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Owner Radar & Network Monitor — PIXMART",
  description: "Pusat monitoring transaksi P2P, mediasi dispute, dan audit log sistem.",
};

export default async function AdminPage() {
  const session = await getSession();
  const metrics = store.getPlatformMetrics();
  const allRooms = store.getAllEscrowRooms();
  const users = store.getUsers();
  const listings = store.getListings();
  const auditLogs = store.getAuditLogs();

  return (
    <OwnerDashboardContent
      metrics={metrics}
      rooms={allRooms}
      users={users}
      listings={listings}
      auditLogs={auditLogs}
      session={session}
    />
  );
}

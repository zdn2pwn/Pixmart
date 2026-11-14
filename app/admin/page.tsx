import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { OwnerDashboardContent } from "./OwnerDashboardContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Radar & Network Monitor — PIXMART",
};

export default async function AdminPage() {
  const session = await getSession();
  const metrics = store.getPlatformMetrics();
  const allOrders = store.getAllOrders();

  return (
    <OwnerDashboardContent
      metrics={metrics}
      orders={allOrders}
      session={session}
    />
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { AdminShell } from "@/components/layout/AdminShell";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const activeEscrowCount = store.getPlatformMetrics().activeEscrowsCount;

  return (
    <AdminShell session={session} lowStockCount={activeEscrowCount}>
      {children}
    </AdminShell>
  );
}

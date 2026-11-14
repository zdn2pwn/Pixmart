import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { redirect } from "next/navigation";
import { UsersPageContent } from "./UsersPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direktori Peer Nodes & Reputasi Pengguna — PIXMART",
  description: "Daftar peer terdistribusi dan reputasi kepercayaan di jaringan PIXMART.",
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const users = store.getUsers();

  return <UsersPageContent initialUsers={users} session={session} />;
}

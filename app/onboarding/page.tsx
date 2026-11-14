import { getSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  // Server-side protection
  const session = await getSimpleSession();
  
  if (!session) {
    redirect("/login?from=/onboarding");
  }

  // If already completed, redirect to dashboard
  if (session.setupCompleted) {
    redirect(session.role === "SELLER" ? "/seller" : "/dashboard");
  }

  return <OnboardingClient />;
}

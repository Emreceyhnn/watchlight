import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";

// The sign-in screen and the SOC dashboard are application UI, not content:
// keep them out of search results so the landing page is what ranks.
export const metadata: Metadata = {
  title: "Dashboard — Watchlight",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}

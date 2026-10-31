import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Watchlight — Mini-SIEM / SOC Dashboard",
  description: "Real-time security monitoring, made simple.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-soc-dark text-gray-100 antialiased selection:bg-cyan-500 selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

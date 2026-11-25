import Link from "next/link";
import { Github, ShieldCheck } from "lucide-react";
import { DASHBOARD_PATH, GITHUB_URL } from "@/lib/site";
import { container, primaryBtn } from "./ui";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#rules", label: "Detection rules" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
] as const;

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-soc-accent/30 bg-soc-accent/10 text-soc-accent shadow-[0_0_15px_rgba(91,140,255,0.2)]"
      >
        <ShieldCheck size={19} />
      </span>
      <span className="font-heading text-lg font-bold tracking-wider text-white">
        WATCHLIGHT
      </span>
    </span>
  );
}

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-soc-base/80 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" aria-label="Watchlight home">
          <LogoMark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map(({ href, label }) =>
            href.startsWith("/") ? (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ) : (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watchlight on GitHub (opens in a new tab)"
            className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:text-white sm:inline-flex"
          >
            <Github size={20} aria-hidden />
          </a>
          <Link href={DASHBOARD_PATH} className={`${primaryBtn} !px-4 !py-2`}>
            Open dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

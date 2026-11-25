import Link from "next/link";
import { DASHBOARD_PATH, GITHUB_URL } from "@/lib/site";
import { LogoMark } from "./LandingHeader";
import { container } from "./ui";

const linkClass =
  "text-sm text-gray-400 transition-colors hover:text-white";

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-soc-base">
      <div className={`${container} py-12 md:py-16`}>
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Watchlight home">
              <LogoMark />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              Open-source mini-SIEM and SOC dashboard: real-time detection,
              MITRE ATT&amp;CK mapping, live alerts and incident triage.
            </p>
          </div>

          <nav aria-label="Product">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-300">
              Product
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={DASHBOARD_PATH} className={linkClass}>
                  Open dashboard
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className={linkClass}>
                  How it works
                </a>
              </li>
              <li>
                <a href="#rules" className={linkClass}>
                  Detection rules
                </a>
              </li>
              <li>
                <a href="#faq" className={linkClass}>
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Project">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-300">
              Project
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Documentation
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  MIT License
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-soc-border-soft pt-6 font-mono text-xs text-gray-400 sm:flex-row">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-soc-success" />
            © {year} Watchlight
          </span>
          <span>MIT licensed · Not a replacement for a commercial SIEM</span>
        </div>
      </div>
    </footer>
  );
}

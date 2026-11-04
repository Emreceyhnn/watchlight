"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Eye, EyeOff, ArrowRight, KeyRound, Lock } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message || "Invalid email or password.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-soc-base text-gray-200 antialiased">
      {/* Ambient background */}
      <div className="fixed inset-0 soc-grid-bg pointer-events-none" />
      <div className="fixed inset-0 soc-radial-glow pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center border-b border-white/[0.06] bg-soc-base/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-soc-accent/10 border border-soc-accent/30 flex items-center justify-center text-soc-accent shadow-[0_0_15px_rgba(91,140,255,0.2)]">
            <ShieldCheck size={19} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-lg tracking-wider text-white">WATCHLIGHT</span>
            <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest hidden sm:inline-block">
              Mini-SIEM v1
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-soc-panel border border-soc-border/60 font-mono text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-soc-success" />
          </span>
          <span className="text-gray-300">System Status: Operational</span>
        </div>
      </header>

      {/* Auth card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-soc-critical/90 font-medium uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-soc-critical animate-pulse" />
              RESTRICTED ACCESS &middot; TIER 1-3
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-soc-panel/95 border border-soc-border rounded-xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative"
          >
            <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-soc-accent/80 to-transparent" />

            <div className="text-center mb-7">
              <div className="mx-auto w-12 h-12 rounded-xl bg-soc-accent/10 border border-soc-accent/30 flex items-center justify-center text-soc-accent shadow-[0_0_24px_rgba(91,140,255,0.25)] mb-3">
                <ShieldCheck size={26} />
              </div>
              <h1 className="font-heading font-bold text-xl tracking-wider text-white">WATCHLIGHT</h1>
              <p className="text-xs text-gray-400 mt-1 tracking-wide">Security Operations Center</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block font-mono text-xs text-gray-300 font-medium">
                  Analyst ID or Work Email
                </label>
                <div className="relative rounded-lg group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-soc-accent transition-colors">
                    <KeyRound size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="analyst@watchlight.sec"
                    className="w-full pl-10 pr-3 py-2.5 bg-soc-card border border-soc-border rounded-lg text-gray-200 placeholder:text-gray-600 font-mono text-xs focus:outline-none focus:border-soc-accent focus:ring-1 focus:ring-soc-accent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block font-mono text-xs text-gray-300 font-medium">
                  Password
                </label>
                <div className="relative rounded-lg group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-soc-accent transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-soc-card border border-soc-border rounded-lg text-gray-200 placeholder:text-gray-600 font-mono text-xs tracking-wider focus:outline-none focus:border-soc-accent focus:ring-1 focus:ring-soc-accent transition-all"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password view"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-soc-critical">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-soc-accent hover:bg-[#4878EC] active:scale-[0.99] text-white font-heading font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_0_20px_rgba(91,140,255,0.3)] disabled:opacity-60"
                >
                  <span>{isSubmitting ? "Authenticating..." : "Authenticate Session"}</span>
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-soc-border/60">
              <div className="flex items-start gap-2 text-gray-500 font-mono text-[11px] leading-relaxed">
                <ShieldCheck size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <span>
                  Protected by mTLS &amp; hardware key verification. Unauthorized access attempts are
                  actively logged and referred to SecOps Incident Response.
                </span>
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="relative z-10 w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center border-t border-white/[0.06] bg-soc-base/80 backdrop-blur-sm font-mono text-xs text-gray-500">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <span className="w-1.5 h-1.5 rounded-full bg-soc-success" />
          <span>© {new Date().getFullYear()} Watchlight SOC. Enterprise Mini-SIEM Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span>TLS 1.3 &middot; ChaCha20</span>
        </div>
      </footer>
    </div>
  );
}

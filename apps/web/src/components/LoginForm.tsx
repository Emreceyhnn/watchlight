"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

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
      setError(result.message || "Giriş başarısız.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-soc-base text-gray-100 px-4">
      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-soc-accent/30 bg-soc-accent/10">
            <Shield className="h-4 w-4 text-soc-accent" />
          </div>
          <span className="font-heading font-bold tracking-wider text-sm">
            WATCHLIGHT <span className="ml-1 text-gray-600 font-sans font-normal">MINI-SIEM</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-soc-border bg-soc-card px-2.5 py-1.5 text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-soc-success animate-pulse" />
          System Status: Operational
        </div>
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="mb-5 flex items-center justify-between text-[11px] font-mono text-gray-500">
          <span className="flex items-center gap-1.5 text-soc-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-soc-critical" />
            RESTRICTED ACCESS
          </span>
          <span>NODE: PROD-AUTH-01</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-soc-border bg-soc-panel p-8 shadow-2xl"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-soc-accent/30 bg-soc-accent/10 shadow-glow">
              <ShieldCheck className="h-7 w-7 text-soc-accent" />
            </div>
            <div className="font-heading text-xl font-bold tracking-wide">WATCHLIGHT</div>
            <div className="text-sm text-gray-500">Security Operations Center</div>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Analyst ID or Work Email
          </label>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 focus-within:border-soc-accent transition-colors">
            <Mail className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="soc.analyst@watchlight.sec"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
              autoComplete="username"
            />
          </div>

          <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 focus-within:border-soc-accent transition-colors">
            <Lock className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent font-mono text-sm tracking-wider outline-none"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="shrink-0 text-gray-500 hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-soc-critical/30 bg-soc-critical/10 px-3 py-2 text-xs text-soc-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-soc-accent py-2.5 text-sm font-semibold text-white transition hover:bg-soc-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? "Authenticating…" : "Authenticate Session"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="mt-6 flex items-start gap-2 border-t border-soc-border-soft pt-5 text-[11px] leading-relaxed text-gray-500">
            <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-600" />
            <span>
              Protected access. Unauthorized access attempts are actively logged and referred to
              SecOps Incident Response.
            </span>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-mono text-gray-600">
          <span>Cluster: us-east-1</span>
          <span>·</span>
          <span>TLS 1.3 · ChaCha20</span>
        </div>
      </div>
    </div>
  );
}

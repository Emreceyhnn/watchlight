"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-gray-800 bg-[#0F1620] p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center gap-2 text-cyan-400">
          <ShieldCheck size={24} />
          <span className="text-lg font-semibold">Watchlight SOC</span>
        </div>

        <label htmlFor="login-email" className="mb-1 block text-sm text-gray-300">Email Address</label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-gray-700 bg-[#0B0F14] px-3 py-2 text-sm text-gray-100 outline-none focus:border-cyan-500"
          autoComplete="username"
        />

        <label htmlFor="login-password" className="mb-1 block text-sm text-gray-300">Password</label>
        <input
          id="login-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border border-gray-700 bg-[#0B0F14] px-3 py-2 text-sm text-gray-100 outline-none focus:border-cyan-500"
          autoComplete="current-password"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-cyan-600 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {isSubmitting ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

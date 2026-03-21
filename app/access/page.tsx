"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      {/* Left accent bar */}
      <div className="fixed left-0 top-0 bottom-0 w-1.5 bg-red" />

      <div className="w-full max-w-sm">
        {/* Logo / product name */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red/10 border border-red/20 text-red text-xs font-semibold mb-6 uppercase tracking-widest">
            Private Access Portal
          </div>
          <h1 className="font-display font-bold text-4xl text-txt leading-tight mb-2">
            Dealer Webpage<br />
            <span className="text-red">Optimizer</span>
          </h1>
          <p className="text-txt-4 text-sm mt-4 leading-relaxed">
            Internal access only. Enter password to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="lbl sr-only">Access Password</label>
            <input
              type="password"
              className="inp text-center text-base tracking-widest"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red text-xs text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full py-3 text-sm rounded-xl"
          >
            {loading ? "Verifying…" : "Continue →"}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-txt-4 text-xs text-center mt-8 opacity-50">
          Dealer Webpage Optimizer · Internal Use Only
        </p>
      </div>
    </div>
  );
}

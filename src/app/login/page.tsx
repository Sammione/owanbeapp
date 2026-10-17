"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

const DEMO_PERSONAS = [
  {
    roleTitle: "Platform Administrator & Hub Manager",
    email: "admin@owambecloset.com",
    password: "OwambeAdmin2026!",
    desc: "Inspect and approve incoming listings, handle pick-ups, and process security deposit refunds.",
    badge: "Staff Portal",
    badgeTone: "ok",
    redirectTo: "/hub",
  },
  {
    roleTitle: "Event Host & Borrower",
    email: "borrower@owambecloset.com",
    password: "OwambeBorrower2026!",
    desc: "Browse designer traditional wear, luxury footwear, event equipment, and test Paystack checkout.",
    badge: "Borrower Portal",
    badgeTone: "",
    redirectTo: "/",
  },
  {
    roleTitle: "Wardrobe Partner & Equipment Vendor",
    email: "vendor@owambecloset.com",
    password: "OwambeVendor2026!",
    desc: "List luxury attire (70%), coolers and party pots (80%), catering packages, and manage NUBAN payouts.",
    badge: "Vendor Portal",
    badgeTone: "warn",
    redirectTo: "/me?mode=lender",
  },
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(params.get("error") ? "That sign-in link has expired. Please request a new one." : "");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent, customEmail?: string, customPassword?: string, customNext?: string) {
    if (e) e.preventDefault();
    setError("");
    const targetEmail = (customEmail ?? email).trim();
    const targetPass = customPassword ?? password;
    const targetNext = customNext ?? next;

    if (!/^\S+@\S+\.\S+$/.test(targetEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!targetPass) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPass,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "Invalid email or password. Please try again." : authError.message);
      return;
    }

    router.replace(targetNext);
    router.refresh();
  }

  async function triggerDemoLogin(persona: typeof DEMO_PERSONAS[number]) {
    setError("");
    setDemoLoading(persona.email);
    setEmail(persona.email);
    setPassword(persona.password);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: persona.email,
      password: persona.password,
    });
    setDemoLoading(null);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace(persona.redirectTo);
    router.refresh();
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setLoading(false);
    if (error) { setError("That code didn’t work. Check it or request a new one."); return; }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="container narrow" style={{ maxWidth: 480 }}>
      {/* 1-Click Demo Testing Hub Card */}
      <div className="box" style={{ background: "rgba(212, 175, 55, 0.08)", borderColor: "rgba(212, 175, 55, 0.35)", marginBottom: 24 }}>
        <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
          <strong style={{ fontSize: "0.95rem", color: "var(--gold)" }}>Direct Test Accounts</strong>
          <span className="pill ok" style={{ fontSize: "0.75rem" }}>Instant Access</span>
        </div>
        <p className="small muted" style={{ margin: "0 0 12px" }}>
          Select any persona to test the platform immediately:
        </p>

        <div className="stack g8">
          {DEMO_PERSONAS.map((p) => {
            const isLoggingIn = demoLoading === p.email;
            return (
              <div
                key={p.email}
                style={{
                  background: "var(--card-bg, #ffffff)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div className="row between" style={{ alignItems: "center" }}>
                  <strong>{p.roleTitle}</strong>
                  <span className={`pill small ${p.badgeTone}`}>{p.badge}</span>
                </div>
                <p className="small muted" style={{ margin: 0 }}>{p.desc}</p>
                <div className="row between" style={{ alignItems: "center", marginTop: 4 }}>
                  <code style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{p.email}</code>
                  <button
                    type="button"
                    className="btn small"
                    disabled={loading || !!demoLoading}
                    onClick={() => triggerDemoLogin(p)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {isLoggingIn ? "Signing in…" : "Sign in →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <details style={{ marginTop: 12, fontSize: "0.82rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--gold)", fontWeight: 600 }}>
            Show demo passwords & credentials
          </summary>
          <div style={{ marginTop: 8, padding: 8, background: "rgba(0,0,0,0.03)", borderRadius: 6 }} className="stack g4">
            <div><strong>Admin:</strong> <code>admin@owambecloset.com</code> · Pass: <code>OwambeAdmin2026!</code></div>
            <div><strong>Borrower:</strong> <code>borrower@owambecloset.com</code> · Pass: <code>OwambeBorrower2026!</code></div>
            <div><strong>Vendor:</strong> <code>vendor@owambecloset.com</code> · Pass: <code>OwambeVendor2026!</code></div>
            <div><strong>Owner Admin:</strong> <code>sammione531@gmail.com</code> · Pass: <code>OwambeAdmin2026!</code></div>
          </div>
        </details>
      </div>

      {/* Standard Sign In Form */}
      <div className="stack g6" style={{ marginBottom: 16 }}>
        <h1>Sign in</h1>
        <p className="muted">Enter your account credentials or switch to one-time email code.</p>
      </div>

      {/* Auth Mode Toggle */}
      <div className="row g8" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`btn small ${authMode === "password" ? "" : "ghost"}`}
          onClick={() => { setAuthMode("password"); setError(""); }}
        >
          Password Sign-In
        </button>
        <button
          type="button"
          className={`btn small ${authMode === "otp" ? "" : "ghost"}`}
          onClick={() => { setAuthMode("otp"); setError(""); }}
        >
          Email OTP / Code
        </button>
      </div>

      {authMode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="stack g12">
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn block" disabled={loading || !!demoLoading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : !sent ? (
        <form onSubmit={sendOtp} className="stack g12">
          <div className="field">
            <label htmlFor="otp-email">Email address</label>
            <input
              id="otp-email"
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn block" disabled={loading || !!demoLoading}>
            {loading ? "Sending…" : "Send my code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="stack g12">
          <div className="field">
            <label htmlFor="code">Code from the email</label>
            <input
              id="code"
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={10}
              required
            />
            <span className="hint">We sent a sign-in code to {email}.</span>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn block" disabled={loading || !!demoLoading}>
            {loading ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn ghost block"
            onClick={() => { setSent(false); setCode(""); }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

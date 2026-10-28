"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

const DEMO_PERSONAS = [
  {
    roleTitle: "Platform Administrator & Hub Manager",
    email: "admin@owanbefit.com",
    password: "OwambeAdmin2026!",
    desc: "Inspect and approve incoming listings, handle pick-ups, and process security deposit refunds.",
    badge: "Staff Portal",
    badgeTone: "ok",
    redirectTo: "/hub",
  },
  {
    roleTitle: "Event Host & Borrower",
    email: "borrower@owanbefit.com",
    password: "OwambeBorrower2026!",
    desc: "Browse designer traditional wear, luxury footwear, event equipment, and test Paystack checkout.",
    badge: "Borrower Portal",
    badgeTone: "",
    redirectTo: "/",
  },
  {
    roleTitle: "Wardrobe Partner & Equipment Vendor",
    email: "vendor@owanbefit.com",
    password: "OwambeVendor2026!",
    desc: "List luxury attire (70%), coolers and party pots (80%), catering packages, and manage NUBAN payouts.",
    badge: "Vendor Portal",
    badgeTone: "warn",
    redirectTo: "/me?mode=lender",
  },
  {
    roleTitle: "Event Hall & Marquee Venue Manager",
    email: "hallowner@owanbefit.com",
    password: "OwambeHall2026!",
    desc: "Showcase 5 hall photos, manage dates, track direct WhatsApp tour leads, and manage ₦7,500/mo token subscription.",
    badge: "Venue Portal",
    badgeTone: "ok",
    redirectTo: "/me?mode=lender&tab=subscription",
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
      {/* 1-Click Demo Testing Hub Card */}
      <div
        className="box"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
          <strong style={{ fontSize: "0.95rem", color: "var(--accent-gold, #D4AF37)", letterSpacing: "0.02em" }}>Direct Test Accounts</strong>
          <span className="pill ok" style={{ fontSize: "0.75rem" }}>Instant Access</span>
        </div>
        <p className="small muted" style={{ margin: "0 0 14px", color: "var(--ink-secondary)" }}>
          Select any persona to test the platform immediately:
        </p>

        <div className="stack g10">
          {DEMO_PERSONAS.map((p) => {
            const isLoggingIn = demoLoading === p.email;
            return (
              <div
                key={p.email}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md, 8px)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div className="row between" style={{ alignItems: "center" }}>
                  <strong style={{ color: "var(--ink)", fontSize: "0.92rem" }}>{p.roleTitle}</strong>
                  <span className={`pill small ${p.badgeTone}`}>{p.badge}</span>
                </div>
                <p className="small muted" style={{ margin: 0, color: "var(--ink-secondary)", lineHeight: 1.45 }}>{p.desc}</p>
                <div className="row between" style={{ alignItems: "center", marginTop: 4 }}>
                  <code style={{ fontSize: "0.78rem", color: "var(--ink-muted)", background: "var(--bg-inset)", padding: "2px 8px", borderRadius: 4 }}>
                    {p.email}
                  </code>
                  <button
                    type="button"
                    className="btn small ghost"
                    disabled={loading || !!demoLoading}
                    onClick={() => triggerDemoLogin(p)}
                    style={{ whiteSpace: "nowrap", height: 32, fontSize: "0.82rem", fontWeight: 600 }}
                  >
                    {isLoggingIn ? "Signing in…" : "Sign in →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <details style={{ marginTop: 14, fontSize: "0.82rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--accent-gold, #D4AF37)", fontWeight: 600 }}>
            Show demo passwords & credentials
          </summary>
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: "var(--bg-inset)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--ink-secondary)",
            }}
            className="stack g4"
          >
            <div><strong style={{ color: "var(--ink)" }}>Admin:</strong> <code>admin@owanbefit.com</code> · Pass: <code>OwambeAdmin2026!</code></div>
            <div><strong style={{ color: "var(--ink)" }}>Borrower:</strong> <code>borrower@owanbefit.com</code> · Pass: <code>OwambeBorrower2026!</code></div>
            <div><strong style={{ color: "var(--ink)" }}>Vendor:</strong> <code>vendor@owanbefit.com</code> · Pass: <code>OwambeVendor2026!</code></div>
            <div><strong style={{ color: "var(--ink)" }}>Hall Manager:</strong> <code>hallowner@owanbefit.com</code> · Pass: <code>OwambeHall2026!</code></div>
            <div><strong style={{ color: "var(--ink)" }}>Owner Admin:</strong> <code>sammione531@gmail.com</code> · Pass: <code>OwambeAdmin2026!</code></div>
          </div>
        </details>
      </div>

      {/* Dedicated Hall & Venue Portal Callout */}
      <div
        className="box"
        style={{
          background: "linear-gradient(135deg, rgba(22, 83, 55, 0.1) 0%, rgba(212, 175, 55, 0.08) 100%)",
          border: "1px solid rgba(22, 83, 55, 0.3)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <strong style={{ fontSize: "0.92rem", display: "block" }}>🏛️ Managing an Event Hall or Marquee?</strong>
          <span className="tiny muted">
            Access 5-photo upload, date availability, and ₦7,500/mo token subscription.
          </span>
        </div>
        <Link href="/halls/login" className="btn small" style={{ background: "var(--grade-a, #165337)", color: "#fff", whiteSpace: "nowrap" }}>
          Venue Portal →
        </Link>
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

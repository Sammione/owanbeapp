"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

const HALL_DEMO_ACCOUNT = {
  roleTitle: "Event Hall & Marquee Venue Manager",
  businessName: "The Grand Oasis Event & Banquet Center (Egbeda)",
  email: "hallowner@owanbefit.com",
  password: "OwambeHall2026!",
  desc: "Manage hall profile, 5-photo showcase, track WhatsApp tour leads, and manage ₦7,500/mo token subscription.",
  redirectTo: "/me?mode=lender&tab=subscription",
};

function HallLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/me?mode=lender&tab=subscription";

  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    params.get("error") ? "Your session expired. Please sign in again." : ""
  );
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handlePasswordLogin(
    e: React.FormEvent,
    customEmail?: string,
    customPassword?: string,
    customNext?: string
  ) {
    if (e) e.preventDefault();
    setError("");
    const targetEmail = (customEmail ?? email).trim();
    const targetPass = customPassword ?? password;
    const targetNext = customNext ?? next;

    if (!/^\S+@\S+\.\S+$/.test(targetEmail)) {
      setError("Please enter a valid email address.");
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
      setError(
        authError.message === "Invalid login credentials"
          ? "Invalid email or password. Please verify and try again."
          : authError.message
      );
      return;
    }

    router.replace(targetNext);
    router.refresh();
  }

  async function triggerDemoLogin() {
    setError("");
    setDemoLoading(true);
    setEmail(HALL_DEMO_ACCOUNT.email);
    setPassword(HALL_DEMO_ACCOUNT.password);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: HALL_DEMO_ACCOUNT.email,
      password: HALL_DEMO_ACCOUNT.password,
    });
    setDemoLoading(false);

    if (authError) {
      // If user doesn't exist yet in Supabase auth, sign in anonymously or redirect
      setError(authError.message + " — You can also use Email OTP login below.");
      return;
    }

    router.replace(HALL_DEMO_ACCOUNT.redirectTo);
    router.refresh();
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    setSent(true);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: "email",
    });
    setLoading(false);
    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="container narrow" style={{ maxWidth: 520, margin: "20px auto 60px" }}>
      <div className="row between" style={{ alignItems: "center", marginBottom: 12 }}>
        <Link href="/" className="iconbtn" aria-label="Back to home">
          <Icon name="back" stroke={2} />
        </Link>
        <span className="pill ok" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={14} stroke={2.2} />
          Venue Partner Portal
        </span>
      </div>

      <div className="stack g6" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", lineHeight: 1.15 }}>
          Event Hall &amp; Marquee Login
        </h1>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          Sign in to manage your venue listing, upload high-resolution photos, view direct WhatsApp tour inquiries, and manage your ₦7,500/month listing subscription.
        </p>
      </div>

      {/* 1-Click Demo Hall Manager Account */}
      <div
        className="box"
        style={{
          background: "linear-gradient(135deg, rgba(22, 83, 55, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)",
          borderColor: "rgba(22, 83, 55, 0.35)",
          marginBottom: 20,
          padding: 16,
        }}
      >
        <div className="row between" style={{ alignItems: "center", marginBottom: 6 }}>
          <strong style={{ fontSize: 15, color: "var(--grade-a, #165337)" }}>
            Demo Venue Manager Account
          </strong>
          <span className="pill">Quick Access</span>
        </div>
        <p className="tiny muted" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
          Experience the Hall Manager dashboard with active 30-day launch trial, catalog analytics, and WhatsApp inquiry tracker.
        </p>
        <div className="box" style={{ background: "rgba(0, 0, 0, 0.2)", padding: 10, marginBottom: 12 }}>
          <div className="line" style={{ fontSize: 13, marginBottom: 2 }}>
            <span className="muted">Venue:</span>
            <strong>{HALL_DEMO_ACCOUNT.businessName}</strong>
          </div>
          <div className="line" style={{ fontSize: 13, marginBottom: 2 }}>
            <span className="muted">Email:</span>
            <code>{HALL_DEMO_ACCOUNT.email}</code>
          </div>
          <div className="line" style={{ fontSize: 13 }}>
            <span className="muted">Password:</span>
            <code>{HALL_DEMO_ACCOUNT.password}</code>
          </div>
        </div>
        <button
          type="button"
          onClick={triggerDemoLogin}
          disabled={demoLoading || loading}
          className="btn block small"
          style={{
            background: "var(--grade-a, #165337)",
            color: "#fff",
            borderColor: "var(--grade-a, #165337)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="check" size={16} stroke={2.4} />
          <span>{demoLoading ? "Logging into Venue Dashboard…" : "1-Click Demo Hall Manager Login"}</span>
        </button>
      </div>

      {/* Standard Login Card */}
      <div className="box" style={{ padding: 20 }}>
        <div className="seg" role="group" aria-label="Sign in method" style={{ marginBottom: 16 }}>
          <button
            type="button"
            aria-pressed={authMode === "password"}
            onClick={() => setAuthMode("password")}
          >
            Password Sign In
          </button>
          <button
            type="button"
            aria-pressed={authMode === "otp"}
            onClick={() => setAuthMode("otp")}
          >
            Email Code (OTP)
          </button>
        </div>

        {authMode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="stack g14">
            <div className="field">
              <label htmlFor="h_email">Venue Manager Email</label>
              <input
                id="h_email"
                type="email"
                className="input"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@yourhall.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="h_pass">Account Password</label>
              <input
                id="h_pass"
                type="password"
                className="input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn block" disabled={loading}>
              {loading ? "Authenticating…" : "Sign In to Venue Portal"}
            </button>
          </form>
        ) : !sent ? (
          <form onSubmit={sendOtp} className="stack g14">
            <div className="field">
              <label htmlFor="otp_email">Venue Manager Email</label>
              <input
                id="otp_email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@yourhall.com"
                required
              />
              <span className="hint">We will email you a 6-digit one-time code to sign in instantly.</span>
            </div>

            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn block" disabled={loading}>
              {loading ? "Sending code…" : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="stack g14">
            <div className="field">
              <label htmlFor="otp_code">6-Digit Email Code</label>
              <input
                id="otp_code"
                type="text"
                inputMode="numeric"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
              />
              <span className="hint">Code sent to {email}. Check your inbox or spam.</span>
            </div>

            {error && <p className="error" role="alert">{error}</p>}

            <button className="btn block" disabled={loading}>
              {loading ? "Verifying…" : "Complete Verification"}
            </button>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => { setSent(false); setCode(""); }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>

      {/* New Hall Registration Prompt */}
      <div className="box" style={{ marginTop: 20, textAlign: "center", background: "rgba(255, 255, 255, 0.02)" }}>
        <strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>
          Don't have an owambeFit Venue account yet?
        </strong>
        <p className="tiny muted" style={{ margin: "0 0 12px" }}>
          Get listed across Lagos with 5 photos, verified badge, and direct WhatsApp inquiries. First 30 days are 100% free.
        </p>
        <Link href="/vendors/register?type=hall_manager" className="btn ghost block small">
          Register Your Hall (30-Day Free Trial)
        </Link>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/login" className="small muted">
          ← Looking for General User / Renter Sign In?
        </Link>
      </div>
    </div>
  );
}

export default function HallLoginPage() {
  return (
    <Suspense fallback={<div className="container narrow" style={{ padding: 40 }}><p className="notice">Loading Venue Portal…</p></div>}>
      <HallLoginInner />
    </Suspense>
  );
}

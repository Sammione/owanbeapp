"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(params.get("error") ? "That sign-in link has expired. Please request a new one." : "");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
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

  async function verify(e: React.FormEvent) {
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
    <div className="container narrow" style={{ maxWidth: 440 }}>
      <div className="stack g6">
        <h1>{sent ? "Check your email" : "Sign in"}</h1>
        <p className="muted">
          {sent ? `We sent a sign-in code and link to ${email}.` : "No password needed. We’ll email you a code."}
        </p>
      </div>
      {!sent ? (
        <form onSubmit={send} className="stack g12">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn block" disabled={loading}>{loading ? "Sending…" : "Send my code"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="stack g12">
          <div className="field">
            <label htmlFor="code">Code from the email</label>
            <input id="code" className="input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={10} required />
            <span className="hint">Or just tap the link in the email on this phone.</span>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn block" disabled={loading}>{loading ? "Checking…" : "Sign in"}</button>
          <button type="button" className="btn ghost block" onClick={() => { setSent(false); setCode(""); }}>Use a different email</button>
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

"use client";
import { useActionState } from "react";
import { saveProfile } from "./actions";
import { AREAS } from "@/lib/constants";

export function ProfileForm({ profile, email }: { profile: { full_name: string | null; phone: string | null; area: string | null }; email: string }) {
  const [state, action, pending] = useActionState(saveProfile, null as null | { ok: boolean; message: string });
  return (
    <form action={action} className="stack g12">
      <div className="field">
        <label htmlFor="full_name">Your name</label>
        <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name ?? ""} autoComplete="name" required />
        <span className="hint">Owners only ever see your first name.</span>
      </div>
      <div className="field">
        <label htmlFor="phone">WhatsApp number</label>
        <input id="phone" name="phone" className="input" defaultValue={profile.phone ?? ""} inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" />
        <span className="hint">For pickup, delivery and return reminders.</span>
      </div>
      <div className="field">
        <label htmlFor="area">Your area</label>
        <select id="area" name="area" className="input" defaultValue={profile.area ?? ""}>
          <option value="">Choose…</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <p className="small muted">Signed in as {email}</p>
      {state && <p className={state.ok ? "notice ok" : "error"} role="status">{state.message}</p>}
      <button className="btn block" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export function SaveButton({ itemId, initial, signedIn }: { itemId: string; initial: boolean; signedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/items/${itemId}`);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setBusy(false); return; }
    const res = saved
      ? await supabase.from("saved").delete().eq("user_id", data.user.id).eq("item_id", itemId)
      : await supabase.from("saved").insert({ user_id: data.user.id, item_id: itemId });
    if (!res.error) setSaved(!saved);
    setBusy(false);
  }

  return (
    <button className="iconbtn" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save this outfit"}>
      <Icon name="heart" filled={saved} />
    </button>
  );
}

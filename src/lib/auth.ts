import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import type { Profile } from "@/lib/types";

export async function getUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: (profile as Profile | null) ?? null };
}

export async function requireUser(next: string) {
  const ctx = await getUserAndProfile();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user> };
}

export async function requireStaff() {
  const ctx = await requireUser("/hub");
  if (!ctx.profile || !["hub", "admin"].includes(ctx.profile.role)) redirect("/");
  return ctx;
}

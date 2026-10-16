import { requireUser } from "@/lib/auth";
import type { Hub } from "@/lib/types";
import { ListingForm } from "./ListingForm";

export default async function ListPage() {
  const { supabase, user, profile } = await requireUser("/list");
  const { data: hubs } = await supabase.from("hubs").select("*").eq("active", true).order("name");
  return (
    <div className="container narrow">
      <div className="stack g6">
        <h1>Let your wardrobe pay you</h1>
        <p className="muted">Snap it and set a price. Drop it at a hub, and we check, clean, grade and photograph it before renters see it. You earn 70% of every rental.</p>
      </div>
      <ListingForm userId={user.id} hubs={(hubs ?? []) as Hub[]} defaultArea={profile?.area ?? null} />
    </div>
  );
}

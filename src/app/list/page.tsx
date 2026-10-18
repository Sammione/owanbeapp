import { requireUser } from "@/lib/auth";
import type { Hub } from "@/lib/types";
import { ListingForm } from "./ListingForm";

export default async function ListPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const { supabase, user, profile } = await requireUser("/list");
  const { data: hubs } = await supabase.from("hubs").select("*").eq("active", true).order("name");

  const initialType =
    sp.type === "venue" || profile?.vendor_type === "hall_manager"
      ? "venue"
      : sp.type === "equipment" || profile?.vendor_type === "equipment_rental"
      ? "equipment"
      : sp.type === "service" || ["caterer", "small_chops", "drinks"].includes(profile?.vendor_type ?? "")
      ? "service"
      : "fashion";

  return (
    <div className="container narrow">
      <ListingForm
        userId={user.id}
        hubs={(hubs ?? []) as Hub[]}
        defaultArea={profile?.area ?? null}
        initialType={initialType}
        userVendorType={profile?.vendor_type ?? null}
      />
    </div>
  );
}

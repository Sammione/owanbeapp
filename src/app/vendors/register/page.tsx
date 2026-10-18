import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { VendorForm } from "./VendorForm";

export default async function VendorRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const isHall = sp.type === "hall_manager" || sp.type === "venue";
  const { user, profile } = await requireUser("/vendors/register");

  return (
    <div className="container narrow" style={{ maxWidth: 640 }}>
      <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
        <Link href={isHall ? "/halls/login" : "/"} className="iconbtn" aria-label="Back">
          <Icon name="back" stroke={2} />
        </Link>
        <span className="pill ok" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={13} stroke={2.2} />
          {isHall ? "Venue Partner Network · 30-Day Free Trial" : "Vendor & Venue Network"}
        </span>
      </div>

      <div className="stack g6" style={{ marginBottom: 20 }}>
        <h1>{isHall ? "Register Your Event Hall or Marquee" : "Onboard as an Event Partner"}</h1>
        <p className="muted">
          {isHall
            ? "List your event hall, banquet ballroom, or marquee pavilion across Lagos. Connect directly with wedding couples and party hosts with 5 guided photos, WhatsApp tour inquiries, and 0% commission on your hall rental fee."
            : "List your event halls & marquees, equipment (coolers, party pots, warmers), or catering packages. Connect with thousands of Lagos party hosts and receive guaranteed automated payouts."}
        </p>
      </div>

      <VendorForm
        userEmail={user.email ?? ""}
        defaultArea={profile?.area ?? null}
        defaultVendorType={isHall ? "hall_manager" : undefined}
      />
    </div>
  );
}

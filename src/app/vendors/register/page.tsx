import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { VendorForm } from "./VendorForm";

export default async function VendorRegisterPage() {
  const { user, profile } = await requireUser("/vendors/register");

  return (
    <div className="container narrow" style={{ maxWidth: 640 }}>
      <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
        <Link href="/" className="iconbtn" aria-label="Back to home">
          <Icon name="back" stroke={2} />
        </Link>
        <span className="pill ok">Vendor Network</span>
      </div>

      <div className="stack g6" style={{ marginBottom: 20 }}>
        <h1>Onboard as an Event Partner</h1>
        <p className="muted">
          List your event equipment (coolers, party pots, warmers, canopies) or catering packages. Connect with thousands of Lagos party hosts and receive guaranteed automated payouts.
        </p>
      </div>

      <VendorForm userEmail={user.email ?? ""} defaultArea={profile?.area ?? null} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { GRADES } from "@/lib/constants";
import { naira } from "@/lib/format";
import { defaultDeposit } from "@/lib/pricing";
import type { Item } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { Checklist, PhotoInput } from "@/components/Checklist";
import { approveItem, rejectItem } from "../../actions";

export default async function Inspect({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).maybeSingle<Item>();
  if (!item) notFound();
  const { data: owner } = await supabase.from("profiles").select("full_name,phone").eq("id", item.owner_id).maybeSingle();

  return (
    <div className="container narrow">
      <Link href="/hub" className="iconbtn" aria-label="Back to hub"><Icon name="back" stroke={2.2} /></Link>
      <div className="stack g4">
        <span className="pill" style={{ alignSelf: "flex-start" }}>{item.status}</span>
        <h1>{item.title}</h1>
        <p className="muted">{item.category} · {naira(item.price)} per rental · owner {owner?.full_name ?? "unnamed"}{owner?.phone ? ` (${owner.phone})` : ""}</p>
      </div>
      {sp.error && <p className="notice bad" role="alert">{sp.error}</p>}

      <div className="uploads">
        {item.photos.map((p, i) => (
          <a key={p} href={p} target="_blank" rel="noreferrer" className="upload" style={{ borderStyle: "solid" }}>
            <img src={p} alt={`Owner photo ${i + 1}`} />
          </a>
        ))}
      </div>

      <div className="box">
        <h3>Owner’s details to verify</h3>
        <div className="line"><span>Size</span><strong>{item.size_label ?? "—"}</strong></div>
        {(["bust", "waist", "hip", "length", "sleeve"] as const).map((k) => (
          <div className="line" key={k}><span>{k[0].toUpperCase() + k.slice(1)}</span><strong>{item[k] ?? "—"}</strong></div>
        ))}
        <div className="line"><span>Includes</span><strong>{item.pieces ?? "—"}</strong></div>
        {item.description && <p className="small muted">{item.description}</p>}
      </div>

      <form action={approveItem} className="stack g16">
        <input type="hidden" name="id" value={item.id} />
        <Checklist />
        <div className="field">
          <span className="label">Grade (your call, not the owner’s)</span>
          <div className="stack g8">
            {(["A", "B", "C"] as const).map((g) => (
              <label key={g} className="listrow" style={{ cursor: "pointer" }}>
                <input type="radio" name="grade" value={g} defaultChecked={item.grade === g} required />
                <span className={`grade ${g}`}>{g}</span>
                <span className="small"><strong>{GRADES[g].label}.</strong> {GRADES[g].note}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="quality">Fabric quality</label>
            <select id="quality" name="quality" className="input" defaultValue={item.quality ?? "standard"}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="deposit">Deposit (₦)</label>
            <input id="deposit" name="deposit" className="input" inputMode="numeric" defaultValue={item.deposit || defaultDeposit(item.price)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="tag_code">Tag code (sewn-in label)</label>
          <input id="tag_code" name="tag_code" className="input" defaultValue={item.tag_code ?? ""} placeholder="e.g. IKO-0042" maxLength={20} />
        </div>
        <PhotoInput />
        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" className="input" placeholder="Any flaws, repairs or cleaning notes" />
        </div>
        <p className="hint">Only approve after the outfit is cleaned and photographed. Approving makes it live immediately.</p>
        <button className="btn block">Approve and make live</button>
      </form>

      <form action={rejectItem} className="stack g10 box">
        <input type="hidden" name="id" value={item.id} />
        <h3>Not accepting it?</h3>
        <div className="field">
          <label htmlFor="reason">Reason the owner will see</label>
          <input id="reason" name="reason" className="input" placeholder="e.g. Stain on the front panel that won’t come out" maxLength={300} />
        </div>
        <button className="btn danger block">Reject listing</button>
      </form>
    </div>
  );
}

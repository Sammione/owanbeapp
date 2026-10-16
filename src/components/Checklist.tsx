import { CHECKLIST } from "@/lib/constants";

export function Checklist() {
  return (
    <fieldset className="checklist" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="label" style={{ marginBottom: 8 }}>Condition checklist</legend>
      {CHECKLIST.map((c) => (
        <label key={c.key}>
          <input type="checkbox" name={`c_${c.key}`} />
          {c.label}
        </label>
      ))}
    </fieldset>
  );
}

export function PhotoInput() {
  return (
    <div className="field">
      <label htmlFor="photos">Condition photos</label>
      <input id="photos" name="photos" type="file" accept="image/*" multiple className="input" />
      <span className="hint">Front, back and any flaws. Stored privately for disputes.</span>
    </div>
  );
}

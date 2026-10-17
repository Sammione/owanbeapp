"use client";
import { useEffect, useState, useActionState } from "react";
import { saveBankDetails } from "./actions";
import { FALLBACK_NIGERIAN_BANKS } from "@/lib/constants";
import { Icon } from "@/components/Icon";

type Bank = { name: string; code: string };

type BankData = {
  bank_name?: string | null;
  bank_code?: string | null;
  account_number?: string | null;
  account_name?: string | null;
};

export function BankSettingsForm({ initialData }: { initialData?: BankData }) {
  const [banks, setBanks] = useState<Bank[]>(FALLBACK_NIGERIAN_BANKS);
  const [bankCode, setBankCode] = useState(initialData?.bank_code ?? "058");
  const [accountNumber, setAccountNumber] = useState(initialData?.account_number ?? "");
  const [accountName, setAccountName] = useState(initialData?.account_name ?? "");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const [state, action, pending] = useActionState(
    saveBankDetails,
    null as null | { ok: boolean; message: string }
  );

  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks && Array.isArray(data.banks)) {
          setBanks(data.banks);
        }
      })
      .catch(() => {});
  }, []);

  const selectedBank = banks.find((b) => b.code === bankCode) ?? banks[0];

  async function handleResolve(acc: string, code: string) {
    const clean = acc.trim().replace(/\D/g, "");
    if (clean.length !== 10) {
      setAccountName("");
      return;
    }

    setResolving(true);
    setResolveError("");
    try {
      const res = await fetch("/api/paystack/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: clean, bankCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.account_name) {
        setResolveError(data.error || "Could not verify account name. Check the number.");
        setAccountName("");
      } else {
        setAccountName(data.account_name);
        setResolveError("");
      }
    } catch {
      setResolveError("Verification service temporarily unavailable.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="box" style={{ marginTop: 16 }}>
      <div className="stack g4">
        <h3>Owner Payout Account (Paystack NUBAN)</h3>
        <p className="small muted">
          Where your 70% rental earnings are deposited automatically when a rental completes.
        </p>
      </div>

      <form action={action} className="stack g12">
        <div className="field">
          <label htmlFor="payout_bank">Select Nigerian Bank</label>
          <select
            id="payout_bank"
            name="bank_code"
            className="input"
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              if (accountNumber.length === 10) {
                handleResolve(accountNumber, e.target.value);
              }
            }}
          >
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="bank_name" value={selectedBank?.name ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="account_num">10-Digit NUBAN Account Number</label>
          <div className="row g8">
            <input
              id="account_num"
              name="account_number"
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 0123456789"
              value={accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setAccountNumber(val);
                if (val.length === 10) {
                  handleResolve(val, bankCode);
                } else {
                  setAccountName("");
                  setResolveError("");
                }
              }}
              required
            />
            <button
              type="button"
              className="btn small ghost"
              disabled={accountNumber.length !== 10 || resolving}
              onClick={() => handleResolve(accountNumber, bankCode)}
              style={{ flex: "none" }}
            >
              {resolving ? "Verifying…" : "Verify"}
            </button>
          </div>
        </div>

        {/* Resolved Account Name Card */}
        {accountName ? (
          <div
            className="notice ok"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}
          >
            <Icon name="check" size={16} stroke={2.5} />
            <div className="stack">
              <span className="tiny" style={{ textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>
                Verified Account Name
              </span>
              <strong style={{ fontSize: 14 }}>{accountName}</strong>
            </div>
            <input type="hidden" name="account_name" value={accountName} />
          </div>
        ) : resolveError ? (
          <p className="error small" role="alert">
            {resolveError}
          </p>
        ) : null}

        {state && (
          <p className={state.ok ? "notice ok" : "error"} role="status">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          className="btn block"
          disabled={pending || !accountName || resolving}
        >
          {pending ? "Saving Account…" : "Save Payout Bank Account"}
        </button>
      </form>
    </div>
  );
}

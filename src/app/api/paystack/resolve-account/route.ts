import { NextResponse } from "next/server";
import { resolveAccount } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const { accountNumber, bankCode } = await req.json();
    if (!accountNumber || !bankCode) {
      return NextResponse.json({ error: "Account number and bank are required." }, { status: 400 });
    }
    const result = await resolveAccount(accountNumber, bankCode);
    if (!result) {
      return NextResponse.json({ error: "Could not resolve bank account details." }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

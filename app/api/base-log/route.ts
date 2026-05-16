export const runtime = "edge";

import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Chainstack provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export async function POST(req: Request) {
  try {
    const { click_id } = await req.json();

    // 1. validación básica
    if (typeof click_id !== "string" || click_id.length < 10) {
      return Response.json(
        { error: "Invalid click_id" },
        { status: 400 }
      );
    }

    // IP (opcional pero útil para antifraude)
    const ip =
      req.headers.get("x-forwarded-for") || "unknown";

    // 2. validar click
    const { data: click, error: clickError } = await supabase
      .from("clicks")
      .select("*")
      .eq("click_id", click_id)
      .maybeSingle();

    if (clickError || !click) {
      return Response.json(
        { error: "Invalid click" },
        { status: 400 }
      );
    }

    // 🔥 CHAINSTACK CHECK (NUEVO)
    try {
      const blockNumber = await provider.getBlockNumber();
      console.log("Chainstack OK block:", blockNumber);
    } catch (err) {
      console.log("Chainstack error (non-blocking):", err);
    }

    // 3. evitar doble pago
    const { data: exists } = await supabase
      .from("conversions")
      .select("click_id")
      .eq("click_id", click_id)
      .maybeSingle();

    if (exists) {
      return Response.json(
        { error: "Already processed" },
        { status: 409 }
      );
    }

    // 4. guardar conversión (pendiente)
    await supabase.from("conversions").insert({
      click_id,
      affiliate: click.ref,
      amount: 3,
      status: "pending",
      ip_address: ip,
      created_at: new Date().toISOString(),
    });

    // 5. enviar a cola (con timeout seguro)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(process.env.QUEUE_URL!, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payout",
          click_id,
          affiliate: click.ref,
          amount: 3,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    return Response.json({
      success: true,
      status: "queued",
      chainstack: true
    });

  } catch (err: any) {
    return Response.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

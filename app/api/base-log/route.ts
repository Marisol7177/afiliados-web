import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { click_id } = await req.json();

    if (!click_id) {
      return Response.json({ error: "Missing click_id" }, { status: 400 });
    }

    // 1. validar click
    const { data: click } = await supabase
      .from("clicks")
      .select("*")
      .eq("click_id", click_id)
      .single();

    if (!click) {
      return Response.json({ error: "Invalid click" }, { status: 400 });
    }

    // 2. evitar doble pago
    const { data: exists } = await supabase
      .from("conversions")
      .select("click_id")
      .eq("click_id", click_id)
      .single();

    if (exists) {
      return Response.json({ error: "Already processed" }, { status: 409 });
    }

    // 3. guardar conversión (sin pagar aún)
    await supabase.from("conversions").insert({
      click_id,
      affiliate: click.ref,
      amount: 3,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    // 4. ENVIAR A COLA (NO BLOCKCHAIN AQUÍ)
    await fetch(process.env.QUEUE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payout",
        click_id,
        affiliate: click.ref,
        amount: 3,
      }),
    });

    return Response.json({
      success: true,
      status: "queued",
    });

  } catch (err: any) {
    return Response.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

// 🧱 Supabase (SOLO backend seguro)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔗 Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// 📜 Contrato de recompensas
const contract = new ethers.Contract(
  process.env.AFFILIATE_REWARDS!,
  [
    "function rewardAffiliate(address affiliate, uint256 amount, bytes32 conversionId)"
  ],
  wallet
);

// 💰 cantidad fija por conversión
const PAYOUT_AMOUNT = 3;

/**
 * 🔥 WORKER PRINCIPAL
 * Este se llama desde cola (Redis / API queue)
 */
export async function handlePayout(event: any) {
  try {
    const { click_id, affiliate } = event;

    if (!click_id || !affiliate) return;

    // 🧠 ID único anti doble pago
    const conversionId = ethers.id(click_id + affiliate);

    // 🔒 1. comprobar si ya fue pagado
    const { data: existing } = await supabase
      .from("conversions")
      .select("*")
      .eq("click_id", click_id)
      .single();

    if (!existing) {
      console.log("❌ Conversion no existe");
      return;
    }

    if (existing.status === "paid") {
      console.log("⚠️ Ya pagado, skipping");
      return;
    }

    // 💾 2. marcar como procesando
    await supabase
      .from("conversions")
      .update({ status: "processing" })
      .eq("click_id", click_id);

    // 💸 3. ejecutar pago blockchain
    const tx = await contract.rewardAffiliate(
      affiliate,
      PAYOUT_AMOUNT,
      conversionId
    );

    console.log("✅ TX enviada:", tx.hash);

    // ✅ 4. marcar como pagado
    await supabase
      .from("conversions")
      .update({
        status: "paid",
        tx_hash: tx.hash,
      })
      .eq("click_id", click_id);

    return tx.hash;

  } catch (err: any) {
    console.error("🔥 WORKER ERROR:", err);

    // ⚠️ opcional: marcar como failed
    if (event?.click_id) {
      await supabase
        .from("conversions")
        .update({ status: "failed" })
        .eq("click_id", event.click_id);
    }
  }
}

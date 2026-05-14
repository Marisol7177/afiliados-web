import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { click_id, affiliate, amount } = await req.json();

    if (!click_id || !affiliate) {
      return Response.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    // 1. guardar conversión
    await supabase.from("conversions").insert({
      click_id,
      affiliate,
      amount: amount || 1,
      created_at: new Date().toISOString(),
    });

    // 2. crear ID único anti doble pago
    const conversionId = ethers.id(click_id + affiliate);

    // 3. wallet backend (NO MetaMask)
    const provider = new ethers.JsonRpcProvider(
      "https://mainnet.base.org"
    );

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY!,
      provider
    );

    // 4. contrato de pagos
    const contract = new ethers.Contract(
      process.env.AFFILIATE_REWARDS!,
      [
        "function rewardAffiliate(address affiliate, uint256 amount, bytes32 conversionId)"
      ],
      wallet
    );

    // 5. pago automático
    const tx = await contract.rewardAffiliate(
      affiliate,
      amount || 1,
      conversionId
    );

    console.log("PAYMENT SENT:", tx.hash);

    return Response.json({
      success: true,
      tx: tx.hash,
      conversionId,
    });

  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

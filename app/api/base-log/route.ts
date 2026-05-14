import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 💰 pago fijo en tokens ERC20 (3 tokens)
const PAYOUT_AMOUNT = 3;

export async function POST(req: Request) {
  try {
    const { click_id } = await req.json();

    if (!click_id) {
      return Response.json(
        { success: false, error: "Missing click_id" },
        { status: 400 }
      );
    }

    // 1. VALIDAR CLICK REAL (NO inventado)
    const { data: click } = await supabase
      .from("clicks")
      .select("*")
      .eq("click_id", click_id)
      .single();

    if (!click) {
      return Response.json(
        { success: false, error: "Invalid click" },
        { status: 400 }
      );
    }

    // 2. EVITAR DOBLE PAGO
    const { data: alreadyPaid } = await supabase
      .from("conversions")
      .select("*")
      .eq("click_id", click_id)
      .single();

    if (alreadyPaid) {
      return Response.json(
        { success: false, error: "Already paid" },
        { status: 409 }
      );
    }

    // 3. AFFILIATE REAL (IMPORTANTE: viene del click)
    const affiliate = click.ref;

    if (!affiliate || affiliate === "direct") {
      return Response.json(
        { success: false, error: "Invalid affiliate" },
        { status: 400 }
      );
    }

    // 4. guardar conversión
    await supabase.from("conversions").insert({
      click_id,
      affiliate,
      amount: PAYOUT_AMOUNT,
      created_at: new Date().toISOString(),
    });

    // 5. ID único anti doble pago en blockchain
    const conversionId = ethers.id(click_id + affiliate);

    // 6. provider + wallet backend
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL!
    );

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY!,
      provider
    );

    // 7. contrato ERC20 rewards
    const contract = new ethers.Contract(
      process.env.AFFILIATE_REWARDS!,
      [
        "function rewardAffiliate(address affiliate, uint256 amount, bytes32 conversionId)"
      ],
      wallet
    );

    // 8. pago fijo ERC20 (3 tokens)
    const tx = await contract.rewardAffiliate(
      affiliate,
      PAYOUT_AMOUNT,
      conversionId
    );

    console.log("ERC20 PAYMENT SENT:", tx.hash);

    return Response.json({
      success: true,
      tx: tx.hash,
      affiliate,
      paid: PAYOUT_AMOUNT
    });

  } catch (err: any) {
    console.error("ERROR:", err);

    return Response.json(
      {
        success: false,
        error: err.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

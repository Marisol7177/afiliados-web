import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import ClickTrackerABI from "../../lib/ClickTrackerABI";

const CLICK_CONTRACT =
  "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clickId, ref } = req.body;

  if (!clickId || !ref) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const rpcUrl = process.env.CHAINSTACK_HTTPS!.replace(
      "https://",
      `https://${process.env.CHAINSTACK_USER}:${process.env.CHAINSTACK_PASS}@`
    );

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY!,
      provider
    );

    const clickContract = new ethers.Contract(
      CLICK_CONTRACT,
      ClickTrackerABI,
      wallet
    );

    const tx = await clickContract.registerClick(clickId, ref);
    await tx.wait();

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
    });

  } catch (err: any) {
    console.error("🔥 ERROR REAL FULL:", err);

    return res.status(500).json({
      error: err?.message || "Pipeline failed",
      details: err,
    });
  }
}

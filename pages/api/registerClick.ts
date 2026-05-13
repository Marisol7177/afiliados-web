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
    const rpcBase = process.env.CHAINSTACK_HTTPS;
    const user = process.env.CHAINSTACK_USER;
    const pass = process.env.CHAINSTACK_PASS;

    if (!rpcBase || !user || !pass) {
      throw new Error("Missing Chainstack env variables");
    }

    const rpcUrl = rpcBase.startsWith("https://")
      ? rpcBase.replace(
          "https://",
          `https://${user}:${pass}@`
        )
      : rpcBase;

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("Missing PRIVATE_KEY");
    }

    const wallet = new ethers.Wallet(privateKey, provider);

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
    console.error("🔥 FULL ERROR:", err);

    return res.status(500).json({
      error: err?.message,
      raw: err,
    });
  }
}

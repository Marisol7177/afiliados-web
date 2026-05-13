import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import ClickTrackerABI from "../../lib/ClickTrackerABI";
import CoinFactoryNFT from "../../lib/CoinFactoryNFTABI";

const CLICK_CONTRACT =
  "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

const NFT_CONTRACT =
  process.env.NFT_ADDRESS as string;

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

    // =========================
    // 1️⃣ CLICK TRACKER
    // =========================
    const clickContract = new ethers.Contract(
      CLICK_CONTRACT,
      ClickTrackerABI,
      wallet
    );

    const tx1 = await clickContract.registerClick(clickId, ref);
    await tx1.wait();

    // =========================
    // 2️⃣ NFT MINT
    // =========================
    const nftContract = new ethers.Contract(
      NFT_CONTRACT,
      CoinFactoryNFT,
      wallet
    );

    const metadataURI = `https://your-metadata.com/${clickId}.json`;

    const tx2 = await nftContract.mint(metadataURI);
    await tx2.wait();

    return res.status(200).json({
      success: true,
      clickTx: tx1.hash,
      nftTx: tx2.hash,
    });
  } catch (err) {
    console.error("Error full pipeline:", err);

    return res.status(500).json({
      error: "Pipeline failed",
    });
  }
}

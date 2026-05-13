import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import ClickTrackerABI from "../../lib/ClickTrackerABI";

const CONTRACT_ADDRESS = "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clickId, ref } = req.body;

  if (!clickId || !ref) return res.status(400).json({ error: "Missing parameters" });

  try {
    // Conexión al nodo Chainstack con credenciales privadas
    const provider = new ethers.JsonRpcProvider({
      url: process.env.CHAINSTACK_HTTPS!,
      user: process.env.CHAINSTACK_USER!,
      password: process.env.CHAINSTACK_PASS!,
    });

    // Signer con la cuenta que tenga fondos para pagar gas
    const signer = provider.getSigner ? await provider.getSigner() : provider;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ClickTrackerABI, signer);

    await contract.registerClick(clickId, ref);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error en API registerClick:", err);
    return res.status(500).json({ error: "Blockchain error" });
  }
}

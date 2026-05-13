"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { ethers } from "ethers";
import ClickTrackerABI from "../lib/ClickTrackerABI";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ethereum?: any;
  }
}

const NFT_CONTRACT =
  "0x4CB46E91B37b5efd1Be89E25EAb1cEd7E1C9EbCe";

const RPC_URL =
  process.env.NEXT_PUBLIC_CHAINSTACK_HTTPS!;

export default function Home() {
  const isProcessing = useRef(false);

  const CONTRACT_ADDRESS =
    "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

  const [owner, setOwner] = useState<string>("Loading...");
  const [loadingNFT, setLoadingNFT] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref") || "direct";
    const utm_campaign =
      urlParams.get("utm_campaign") || "unknown";

    localStorage.setItem("ref", ref);
    localStorage.setItem("utm_campaign", utm_campaign);

    loadNFT();
  }, []);

  // 🪙 NFT FIX DIRECTO
  const loadNFT = async () => {
    try {
      setLoadingNFT(true);

      const provider =
        new ethers.JsonRpcProvider(RPC_URL);

      const contract = new ethers.Contract(
        NFT_CONTRACT,
        ["function ownerOf(uint256) view returns (address)"],
        provider
      );

      const result = await contract.ownerOf(1);

      setOwner(result);
    } catch (err) {
      console.error("NFT error:", err);
      setOwner("error loading NFT");
    } finally {
      setLoadingNFT(false);
    }
  };

  const handleClick = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const ref =
      localStorage.getItem("ref") || "direct";
    const utm_campaign =
      localStorage.getItem("utm_campaign") ||
      "unknown";
    const clickId = crypto.randomUUID();

    await supabase.from("clicks").insert({
      click_id: clickId,
      ref,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      country: "unknown",
      utm_campaign,
      created_at: new Date().toISOString(),
    });

    try {
      let provider;

      if (window.ethereum) {
        provider =
          new ethers.BrowserProvider(window.ethereum);
      } else {
        const rpcUrl =
          process.env.NEXT_PUBLIC_CHAINSTACK_HTTPS!.replace(
            "https://",
            `https://${process.env.NEXT_PUBLIC_CHAINSTACK_USER}:${process.env.NEXT_PUBLIC_CHAINSTACK_PASS}@`
          );

        provider =
          new ethers.JsonRpcProvider(rpcUrl);
      }

      const signer = window.ethereum
        ? await provider.getSigner()
        : provider;

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ClickTrackerABI,
        signer
      );

      await contract.registerClick(clickId, ref);
    } catch (err) {
      console.error(
        "Error registrando click en blockchain:",
        err
      );
    }

    const affiliateURL = `https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1&click_id=${clickId}`;

    window.open(affiliateURL, "_blank");

    window.gtag?.("event", "conversion", {
      send_to: "AW-18157086862/-GpsCP7u3ascEI7R_NFD",
      value: 1.0,
      currency: "EUR",
    });
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>Create Your Meme Coin 🚀</h1>

        <button onClick={handleClick}>
          Launch Token
        </button>

        <div style={{ marginTop: "40px" }}>
          <h2>🪙 NFT</h2>

          {loadingNFT ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Owner: {owner}</p>
              <p>Token ID: 1</p>
            </>
          )}

          <button onClick={loadNFT}>
            Refresh NFT
          </button>
        </div>
      </div>
    </main>
  );
}

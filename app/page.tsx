"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ethers } from "ethers";
import ClickTrackerABI from "../lib/ClickTrackerABI";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ethereum?: any;
  }
}

export default function Home() {
  const isProcessing = useRef(false);

  const CONTRACT_ADDRESS =
    "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

  const CHAINSTACK_HTTPS =
    process.env.NEXT_PUBLIC_CHAINSTACK_HTTPS!;
  const CHAINSTACK_USER =
    process.env.NEXT_PUBLIC_CHAINSTACK_USER!;
  const CHAINSTACK_PASS =
    process.env.NEXT_PUBLIC_CHAINSTACK_PASS!;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref") || "direct";
    const utm_campaign = urlParams.get("utm_campaign") || "unknown";

    localStorage.setItem("ref", ref);
    localStorage.setItem("utm_campaign", utm_campaign);
  }, []);

  const handleClick = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const ref = localStorage.getItem("ref") || "direct";
    const utm_campaign = localStorage.getItem("utm_campaign") || "unknown";
    const clickId = crypto.randomUUID();

    // 1️⃣ SUPABASE
    await supabase.from("clicks").insert({
      click_id: clickId,
      ref,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      country: "unknown",
      utm_campaign,
      created_at: new Date().toISOString(),
    });

    // 2️⃣ BLOCKCHAIN
    try {
      let provider;

      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        const rpcUrl = CHAINSTACK_HTTPS.replace(
          "https://",
          `https://${CHAINSTACK_USER}:${CHAINSTACK_PASS}@`
        );

        provider = new ethers.JsonRpcProvider(rpcUrl);
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
      console.error("Error blockchain:", err);
    }

    // 3️⃣ AFFILIATE REDIRECT
    const affiliateURL = `https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1&click_id=${clickId}`;

    window.open(affiliateURL, "_blank");

    // 4️⃣ GOOGLE ADS
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
        <p>Launch tokens instantly on multiple blockchains.</p>

        <button
          onClick={handleClick}
          style={{
            marginTop: "20px",
            padding: "16px 32px",
            background: "white",
            color: "black",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Launch Token
        </button>
      </div>
    </main>
  );
}

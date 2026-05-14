"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ethers } from "ethers";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// 👇 NUEVO CONTRATO (traffic manager)
const abi = [
  "function registerClick(bytes32 clickId) returns (address)"
];

export default function Home() {
  const lock = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    localStorage.setItem(
      "ref",
      urlParams.get("ref") || "direct"
    );

    localStorage.setItem(
      "utm_campaign",
      urlParams.get("utm_campaign") || "unknown"
    );
  }, []);

  const handleClick = async () => {
    if (lock.current) return;
    lock.current = true;

    const clickId = crypto.randomUUID();

    const ref = localStorage.getItem("ref") || "direct";
    const utm_campaign = localStorage.getItem("utm_campaign") || "unknown";

    // 1️⃣ SUPABASE TRACKING
    try {
      await supabase.from("clicks").insert({
        click_id: clickId,
        ref,
        page: window.location.pathname,
        user_agent: navigator.userAgent,
        utm_campaign,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log("Supabase ignored");
    }

    // 2️⃣ DEFAULT FALLBACK LINK
    let affiliateURL =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1";

    // 3️⃣ SMART CONTRACT ROUTING
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL
      );

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_TRAFFIC_MANAGER!,
        abi,
        provider
      );

      const clickHash = ethers.id(clickId);

      const affiliate = await contract.registerClick(clickHash);

      affiliateURL = `https://coinfactory.app/?r=${affiliate}&click_id=${clickId}`;

    } catch (err) {
      console.log("Web3 fallback used", err);
      affiliateURL += `&click_id=${clickId}`;
    }

    // 4️⃣ REDIRECT
    window.open(affiliateURL, "_blank");

    lock.current = false;

    // 5️⃣ ADS TRACKING
    (window as any).gtag?.("event", "conversion", {
      send_to: "AW-18157086862/-GpsCP7u3ascEI7R_NFD",
      value: 1,
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
            marginTop: 20,
            padding: "16px 32px",
            background: "white",
            color: "black",
            borderRadius: 10,
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

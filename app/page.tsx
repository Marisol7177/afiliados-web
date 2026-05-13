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
  const CONTRACT_ADDRESS = "0xe64dF6bAF0F1aC6ff587d3661D43D4065D55E7A5";

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

    // 1️⃣ Guardar en Supabase
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
        // Metamask disponible
        provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ClickTrackerABI, signer);
        await contract.registerClick(clickId, ref);
      } else {
        // Usar endpoint seguro en Vercel
        await fetch("/api/registerClick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickId, ref }),
        });
      }
    } catch (err) {
      console.error("Error registrando click en blockchain:", err);
    }

    // Redirección y seguimiento
    const url = `https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1&click_id=${clickId}`;
    let opened = false;
    const openUrl = () => {
      if (opened) return;
      opened = true;
      window.open(url, "_blank");
    };

    window.gtag?.("event", "conversion", {
      send_to: "AW-18157086862/-GpsCP7u3ascEI7R_NFD",
      value: 1.0,
      currency: "EUR",
      event_callback: openUrl,
    });

    setTimeout(openUrl, 1200);
  };

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1>Create Your Meme Coin 🚀</h1>
        <p>Launch tokens instantly on multiple blockchains.</p>
        <button onClick={handleClick} style={styles.button}>
          Launch Token
        </button>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
  },
  card: { textAlign: "center" as const },
  button: {
    marginTop: "20px",
    padding: "16px 32px",
    background: "white",
    color: "black",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

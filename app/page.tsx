"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function Home() {
  const isProcessing = useRef(false);

  useEffect(() => {
    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref") || "direct";
      const utm_campaign = urlParams.get("utm_campaign") || "unknown";

      localStorage.setItem("ref", ref);
      localStorage.setItem("utm_campaign", utm_campaign);
    };

    run();
  }, []);

  const handleClick = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const ref = localStorage.getItem("ref") || "direct";
    const utm_campaign = localStorage.getItem("utm_campaign") || "unknown";
    const clickId = crypto.randomUUID();

    // 🔵 Insertar en Supabase tabla clicks
    await supabase.from("clicks").insert({
      click_id: clickId,
      ref,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      country: "unknown",
      utm_campaign,
      created_at: new Date().toISOString(),
    });

    const url =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1&click_id=" +
      clickId;

    let opened = false;
    const openUrl = () => {
      if (opened) return;
      opened = true;
      window.open(url, "_blank");
    };

    // Google Ads conversion
    window.gtag?.("event", "conversion", {
      send_to: "AW-18157086862/-GpsCP7u3ascEI7R_NFD",
      value: 1.0,
      currency: "EUR",
      event_callback: openUrl,
    });

    // fallback por seguridad
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

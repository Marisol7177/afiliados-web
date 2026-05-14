"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function Home() {
  const lock = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    localStorage.setItem("ref", urlParams.get("ref") || "direct");
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
    } catch {
      console.log("Supabase ignored");
    }

    // 2️⃣ BASE AFFILIATE
    const BASE_AFFILIATE =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1";

    // 3️⃣ SERVER SIDE BLOCKCHAIN TRACKING
    try {
      const clickHash = crypto.randomUUID();

      await fetch("/api/base-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash: clickHash,
        }),
      });
    } catch (err) {
      console.log("Base log failed", err);
    }

    // 4️⃣ REDIRECT
    const affiliateURL = `${BASE_AFFILIATE}&click_id=${clickId}`;
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

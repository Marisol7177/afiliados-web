"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export default function Home() {
  // Guardar referencia afiliado
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");

    if (ref) {
      localStorage.setItem("ref", ref);
    }
  }, []);

  const handleClick = async () => {
    const ref = localStorage.getItem("ref") || "direct";
    const clickId = crypto.randomUUID();

    // Guardar click en Supabase (COINCIDE con tu tabla)
    await supabase.from("clicks").insert({
      ref,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      country: "unknown",
      created_at: new Date().toISOString(),
    });

    const url =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1&click_id=" +
      clickId;

    // Google Ads conversion
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: "AW-18157086862/-GpsCP7u3ascEI7R_NFD",
        value: 1.0,
        currency: "EUR",

        event_callback: () => {
          window.open(url, "_blank");
        },
      });

      // fallback
      setTimeout(() => {
        window.open(url, "_blank");
      }, 1500);

      return;
    }

    // fallback total
    window.open(url, "_blank");
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

  card: {
    textAlign: "center" as const,
  },

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

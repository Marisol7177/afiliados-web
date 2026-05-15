"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const lock = useRef(false);

  // Guardar tracking de URL al entrar
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

    // 1️⃣ SUPABASE TRACKING (no rompe si falla)
    try {
      await supabase.from("clicks").insert({
        click_id: clickId,
        ref,
        page: window.location.pathname,
        user_agent: navigator.userAgent,
        utm_campaign,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.log("Supabase ignored", err);
    }

    // 2️⃣ BACKEND TRACKING (blockchain / indexer)
    try {
      await fetch("/api/base-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          click_id: clickId,
        }),
      });
    } catch (err) {
      console.log("Base log failed", err);
    }

    // 3️⃣ REDIRECT AFILIADO
    const BASE_AFFILIATE =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1";

    window.open(`${BASE_AFFILIATE}&click_id=${clickId}`, "_blank");

    lock.current = false;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "44px", fontWeight: "700" }}>
        Launch Token
      </h1>

      <p
        style={{
          color: "#aaa",
          maxWidth: "420px",
          marginTop: "12px",
          marginBottom: "28px",
        }}
      >
        Accede al nuevo ecosistema de recompensas Web3 y tracking de afiliados en tiempo real.
      </p>

      <button
        onClick={handleClick}
        style={{
          padding: "14px 28px",
          fontSize: "16px",
          fontWeight: "600",
          borderRadius: "12px",
          border: "1px solid #333",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Launch Token
      </button>
    </main>
  );
}

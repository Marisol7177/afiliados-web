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

    // 1️⃣ Supabase tracking
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

    // 2️⃣ Backend tracking
    try {
      await fetch("/api/base-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ click_id: clickId }),
      });
    } catch (err) {
      console.log("Base log failed", err);
    }

    // 3️⃣ Redirect a tu página / sistema de token
    const BASE_AFFILIATE =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1";

    window.open(`${BASE_AFFILIATE}&click_id=${clickId}`, "_blank");

    lock.current = false;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
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
        Crea tu Token / Memecoin
      </h1>

      <p
        style={{
          color: "#aaa",
          fontSize: "16px",
          maxWidth: "420px",
          marginTop: "12px",
          marginBottom: "28px",
          lineHeight: 1.6,
        }}
      >
        Lanza tu token o memecoin en segundos. Mide la demanda en tiempo real
        y convierte tu idea en movimiento.
      </p>

      <button
        onClick={handleClick}
        style={{
          padding: "16px 32px",
          fontSize: "18px",
          fontWeight: "700",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(90deg, #ff0080, #7928ca)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.05)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 15px rgba(0,0,0,0.3)";
        }}
      >
        Crear mi Token
      </button>
    </main>
  );
}

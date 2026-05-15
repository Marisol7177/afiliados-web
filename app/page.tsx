"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

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

    // 1️⃣ SUPABASE (SE QUEDA)
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

    // 2️⃣ BACKEND + BLOCKCHAIN TRACKING
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

    // 3️⃣ REDIRECT
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
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <button
        onClick={handleClick}
        style={{
          padding: "16px 32px",
          background: "white",
          color: "black",
          borderRadius: 10,
          border: "none",
          fontWeight: "bold",
        }}
      >
        Launch Token
      </button>
    </main>
  );
}

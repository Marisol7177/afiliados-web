"use client";

import { useEffect, useRef } from "react";

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
    // Redirigir a tu página / sistema de token
    const BASE_AFFILIATE =
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1";

    window.open(`${BASE_AFFILIATE}&click_id=${clickId}`, "_blank");

    lock.current = false;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #111, #000)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "46px", fontWeight: "800" }}>
        Crea tu Token o Memecoin
      </h1>

      <p
        style={{
          color: "#aaa",
          fontSize: "16px",
          maxWidth: "460px",
          marginTop: "14px",
          marginBottom: "30px",
          lineHeight: "1.6",
        }}
      >
        Lanza tu idea en Web3 en segundos. Diseña tu token, valida demanda y
        empieza a construir comunidad desde el primer día.
      </p>

      <button
        style={{
          padding: "16px 34px",
          fontSize: "18px",
          fontWeight: "700",
          borderRadius: "14px",
          border: "none",
          background: "linear-gradient(90deg, #ff3d81, #7c3aed)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
        onClick={() => {
          window.location.href =
            "https://coinfactory.app/?r=04398a1ce6cacdddddf20ca38a971d55";
        }}
      >
        Crear mi Token
      </button>
    </main>
  );
}

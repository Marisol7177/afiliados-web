"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("ref", ref);
  }, []);

  const handleClick = async () => {
    const ref = localStorage.getItem("ref") || "direct";

    // 🔥 guardar click en base de datos
    await supabase.from("clicks").insert({
      ref,
      created_at: new Date(),
    });

    window.open(
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1",
      "_blank"
    );
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

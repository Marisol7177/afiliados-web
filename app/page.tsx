"use client";

import { useEffect } from "react";

export default function Home() {

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("ref", ref);
  }, []);

  const handleClick = () => {
    const ref = localStorage.getItem("ref") || "direct";

    // tracking futuro (sin romper nada ahora)
    console.log("affiliate ref:", ref);

    window.open(
      "https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1",
      "_blank"
    );
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        <h1 style={styles.title}>
          Create Your Meme Coin 🚀
        </h1>

        <p style={styles.text}>
          Launch tokens instantly on Ethereum, Base, Solana, Arbitrum and more.
        </p>

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
    padding: "40px",
  },
  container: {
    maxWidth: "700px",
    textAlign: "center" as const,
  },
  title: {
    fontSize: "60px",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  text: {
    fontSize: "20px",
    opacity: 0.8,
    marginBottom: "40px",
  },
  button: {
    display: "inline-block",
    padding: "18px 36px",
    background: "#ffffff",
    color: "#000",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "18px",
  }
};

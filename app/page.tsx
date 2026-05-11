"use client";

export default function Home() {
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
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "60px",
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          Create Your Meme Coin 🚀
        </h1>

        <p
          style={{
            fontSize: "20px",
            opacity: 0.8,
            marginBottom: "40px",
            lineHeight: "1.6",
          }}
        >
          Launch tokens instantly on Ethereum, Base,
          Solana, Arbitrum and more.
        </p>

        <a
          href="https://coinfactory.app/?r=845e00a9f5446e08c9d362e6eb7163d1"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "18px 36px",
            background: "#ffffff",
            color: "#000000",
            borderRadius: "14px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          Launch Token
        </a>
      </div>
    </main>
  );
}

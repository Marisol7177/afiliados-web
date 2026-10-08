"use client";

const AFFILIATE_URL =
  "https://coinfactory.app/?r=04398a1ce6cacdddddf20ca38a971d55";

export default function Home() {
  const handleClick = () => {
    window.location.href = AFFILIATE_URL;
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
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 15px rgba(0,0,0,0.3)";
        }}
      >
        Crear mi Token
      </button>
    </main>
  );
}

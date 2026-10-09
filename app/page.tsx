"use client";

import { useState } from "react";

const AFFILIATE_URL =
  "https://coinfactory.app/?r=04398a1ce6cacdddddf20ca38a971d55";

export default function Home() {
  const [clicks, setClicks] = useState(0);

  function handleClick() {
    setClicks((current) => current + 1);
    window.open(AFFILIATE_URL, "_blank", "noopener,noreferrer");
  }

  const features = [
    {
      icon: "✦",
      title: "Explora tokens",
      description:
        "Descubre herramientas para explorar y crear activos digitales."
    },
    {
      icon: "⌘",
      title: "Red de pruebas",
      description:
        "Prepara y prueba contratos inteligentes antes de publicarlos."
    },
    {
      icon: "◈",
      title: "Blockchain pública",
      description:
        "Prepara conexiones con redes compatibles con Ethereum."
    }
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080812",
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif"
    }}>
      <nav style={{
        padding: "22px 7%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #24243b"
      }}>
        <strong style={{ fontSize: 22 }}>
          <span style={{ color: "#c084fc" }}>◆</span> TOKEN LAB
        </strong>
        <a href="#funciones" style={{ color: "#cbd5e1" }}>
          Funciones
        </a>
      </nav>

      <section style={{
        maxWidth: 1000,
        margin: "auto",
        padding: "100px 24px 80px",
        textAlign: "center"
      }}>
        <p style={{
          color: "#d8b4fe",
          letterSpacing: 3,
          fontSize: 12
        }}>
          TU PUERTA AL ECOSISTEMA BLOCKCHAIN
        </p>

        <h1 style={{
          fontSize: "clamp(38px, 7vw, 72px)",
          lineHeight: 1.08,
          maxWidth: 850,
          margin: "24px auto"
        }}>
          Tu idea puede convertirse en el próximo{" "}
          <span style={{
            background: "linear-gradient(90deg,#e879f9,#818cf8)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent"
          }}>
            token.
          </span>
        </h1>

        <p style={{
          maxWidth: 620,
          margin: "26px auto",
          lineHeight: 1.8,
          color: "#a1a1b5",
          fontSize: 17
        }}>
          Explora herramientas para descubrir, lanzar y comprender
          proyectos de tokens y memecoins.
        </p>

        <button onClick={handleClick} style={{
          padding: "17px 30px",
          borderRadius: 12,
          border: 0,
          color: "white",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          background: "linear-gradient(100deg,#c026d3,#6d5dfc)",
          boxShadow: "0 8px 35px #8b5cf644"
        }}>
          Explorar CoinFactory ↗
        </button>

        <p style={{
          fontSize: 12,
          color: "#77778e",
          marginTop: 16
        }}>
          Se abrirá una plataforma externa. Comprueba sus condiciones
          antes de realizar transacciones.
        </p>
      </section>

      <section id="funciones" style={{
        padding: "55px 7% 90px",
        background: "#0e0e1b"
      }}>
        <h2 style={{
          textAlign: "center",
          fontSize: 32,
          marginBottom: 42
        }}>
          Explora el mundo blockchain
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          maxWidth: 1050,
          margin: "auto"
        }}>
          {features.map((feature) => (
            <article key={feature.title} style={{
              background: "#151526",
              border: "1px solid #292941",
              borderRadius: 18,
              padding: 27
            }}>
              <div style={{
                color: "#d8b4fe",
                fontSize: 30
              }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p style={{
                color: "#a1a1b5",
                lineHeight: 1.7,
                fontSize: 14
              }}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer style={{
        textAlign: "center",
        padding: 30,
        color: "#77778e",
        fontSize: 12
      }}>
        TOKEN LAB · Proyecto independiente · Los criptoactivos implican riesgos.
      </footer>
    </main>
  );
}

"use client";

import { useEffect } from "react";

const TARGET =
  "https://coinfactory.app/?r=04398a1ce6cacdddddf20ca38a971d55";

export default function Home() {
  useEffect(() => {
    window.location.replace(TARGET);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Redirigiendo...
    </main>
  );
}

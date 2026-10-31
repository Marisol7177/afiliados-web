"use client";

import { useEffect, useState } from "react";

type Stats = {
  peersConnected: number;
  filesReceived: number;
  bytesReceived: number;
};

const initial: Stats = {
  peersConnected: 0,
  filesReceived: 0,
  bytesReceived: 0
};

export default function P2PMonitor() {
  const [stats, setStats] = useState<Stats>(initial);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("coinfactory-p2p-stats");
      if (saved) setStats(JSON.parse(saved));
    } catch {}

    const onStats = (event: Event) => {
      const data = (event as CustomEvent<Stats>).detail;
      if (data) setStats(data);
    };

    window.addEventListener("coinfactory-p2p-stats", onStats);

    return () => {
      window.removeEventListener("coinfactory-p2p-stats", onStats);
    };
  }, []);

  return (
    <main style={{
      maxWidth: 720,
      margin: "60px auto",
      padding: 24,
      fontFamily: "system-ui, sans-serif"
    }}>
      <h1>Monitor P2P de CoinFactory</h1>
      <p>Estadísticas de este navegador, no de toda la red.</p>
      <p>Nodos conectados: <strong>{stats.peersConnected}</strong></p>
      <p>Archivos recibidos: <strong>{stats.filesReceived}</strong></p>
      <p>Datos recibidos: <strong>{(stats.bytesReceived / 1024).toFixed(1)} KB</strong></p>
      <p>
        Los archivos solo se contabilizan cuando superan
        la verificación SHA-256.
      </p>
      <a href="/">Volver a CoinFactory</a>
    </main>
  );
}

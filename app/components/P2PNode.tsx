"use client";

import { useEffect } from "react";

const SIGNAL = "wss://coinfactory-signaling.onrender.com";
const ROOM = "coinfactory-public";
const CACHE = "coinfactory-p2p-v1";

export default function P2PNode() {
  useEffect(() => {
    let stopped = false;
    let ws: WebSocket | null = null;
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    const pcs = new Map<string, RTCPeerConnection>();
    const channels = new Map<string, RTCDataChannel>();
    const ice = new Map<string, RTCIceCandidateInit[]>();
    const transfers = new Map<string, {
      path: string; size: number; sha256: string;
      chunks: string[]; received: number;
    }>();
    let manifest: Array<{path:string;size:number;sha256:string}> = [];

    const log = (...args: unknown[]) => console.info("[Coinfactory P2P]", ...args);

    async function getCache() {
      return caches.open(CACHE);
    }

    async function loadManifest() {
      try {
        const response = await fetch("/p2p-manifest.json", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar el manifiesto");
        const data = await response.json();
        if (data.version !== 1 || !Array.isArray(data.resources)) {
          throw new Error("Formato de manifiesto inválido");
        }
        manifest = data.resources;
        log("Manifiesto cargado:", manifest.length, "recursos");
      } catch (error) {
        log("Manifiesto no disponible:", error);
      }
    }

    function signal(type: string, target: string, data: unknown) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, target, data }));
      }
    }

    async function sha256(data: ArrayBuffer) {
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    function sendJSON(channel: RTCDataChannel, message: unknown) {
      if (channel.readyState === "open") channel.send(JSON.stringify(message));
    }

    async function sendResource(channel: RTCDataChannel, path: string, hash: string) {
      try {
        const entry = manifest.find((r) => r.path === path && r.sha256 === hash);
        if (!entry) return;

        const response = await fetch(path);
        if (!response.ok) return;
        const buffer = await response.arrayBuffer();
        if (await sha256(buffer) !== hash) {
          log("Hash de origen incorrecto:", path);
          return;
        }

        sendJSON(channel, {
          kind: "resource-start", path, size: buffer.byteLength, sha256: hash
        });

        const bytes = new Uint8Array(buffer);
        const chunkSize = 12 * 1024;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          if (channel.readyState !== "open") return;
          const part = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
          let binary = "";
          for (let i = 0; i < part.length; i++) binary += String.fromCharCode(part[i]);
          sendJSON(channel, {
            kind: "resource-chunk", path, data: btoa(binary)
          });
          while (channel.bufferedAmount > 1024 * 1024) {
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
        }
        sendJSON(channel, { kind: "resource-end", path });
        log("Recurso enviado:", path);
      } catch (error) {
        log("Error al enviar recurso:", path, error);
      }
    }

    async function onData(channel: RTCDataChannel, peerId: string, raw: string) {
      let msg: any;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.kind === "manifest-request") {
        sendJSON(channel, { kind: "manifest", resources: manifest });
        return;
      }

      if (msg.kind === "manifest" && Array.isArray(msg.resources)) {
        const cache = await getCache();
        let requested = 0;
        for (const resource of msg.resources) {
          if (!resource || typeof resource.path !== "string" ||
              typeof resource.sha256 !== "string" ||
              !resource.path.startsWith("/") ||
              resource.path.startsWith("//")) continue;
          const local = manifest.find((r) =>
            r.path === resource.path && r.sha256 === resource.sha256
          );
          if (!local || local.size !== resource.size) continue;
          const cached = await cache.match(new URL(resource.path, location.origin).href);
          if (cached) continue;
          sendJSON(channel, {
            kind: "resource-request", path: resource.path, sha256: resource.sha256
          });
          requested++;
        }
        if (requested) log(`Solicitando ${requested} recursos a ${peerId}`);
        return;
      }

      if (msg.kind === "resource-request") {
        await sendResource(channel, msg.path, msg.sha256);
        return;
      }

      if (msg.kind === "resource-start" &&
          typeof msg.path === "string" &&
          typeof msg.sha256 === "string" &&
          Number.isSafeInteger(msg.size) && msg.size >= 0 &&
          msg.size <= 50 * 1024 * 1024) {
        transfers.set(msg.path, {
          path: msg.path, size: msg.size, sha256: msg.sha256,
          chunks: [], received: 0
        });
        return;
      }

      if (msg.kind === "resource-chunk" && typeof msg.data === "string") {
        const transfer = transfers.get(msg.path);
        if (!transfer) return;
        const binary = atob(msg.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        transfer.chunks.push(msg.data);
        transfer.received += bytes.length;
        return;
      }

      if (msg.kind === "resource-end") {
        const transfer = transfers.get(msg.path);
        if (!transfer) return;
        transfers.delete(msg.path);

        try {
          const parts = transfer.chunks.map((part) => {
            const binary = atob(part);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
          });
          const blob = new Blob(parts);
          const buffer = await blob.arrayBuffer();
          const expected = manifest.find((r) =>
            r.path === transfer.path && r.sha256 === transfer.sha256
          );

          if (!expected || buffer.byteLength !== transfer.size ||
              transfer.size !== expected.size ||
              await sha256(buffer) !== transfer.sha256) {
            log("Recurso rechazado: verificación SHA-256 fallida", transfer.path);
            return;
          }

          const cache = await getCache();
          await cache.put(
            new URL(transfer.path, location.origin).href,
            new Response(buffer, {
              headers: { "Content-Type": "application/octet-stream",
                         "X-Coinfactory-P2P": "verified" }
            })
          );
          log("Recurso P2P verificado y guardado:", transfer.path);
        } catch (error) {
          log("Error verificando recurso:", error);
        }
      }
    }

    function makePC(peerId: string) {
      const existing = pcs.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcs.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signal("ice-candidate", peerId, event.candidate.toJSON());
        }
      };

      pc.ondatachannel = (event) => setupChannel(event.channel, peerId);
      pc.onconnectionstatechange = () => {
        log("Par", peerId, pc.connectionState);
        if (["failed", "closed"].includes(pc.connectionState)) {
          channels.delete(peerId);
        }
      };
      return pc;
    }

    function setupChannel(channel: RTCDataChannel, peerId: string) {
      channels.set(peerId, channel);
      channel.onopen = () => {
        log("Conexión P2P abierta:", peerId);
        sendJSON(channel, { kind: "manifest-request" });
      };
      channel.onmessage = (event) => {
        if (typeof event.data === "string") {
          void onData(channel, peerId, event.data);
        }
      };
    }

    async function offer(peerId: string) {
      try {
        const pc = makePC(peerId);
        if (pc.signalingState !== "stable") return;
        setupChannel(pc.createDataChannel("coinfactory-resources"), peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (pc.localDescription) {
          signal("offer", peerId, pc.localDescription.toJSON());
        }
      } catch (error) {
        log("Error creando oferta:", error);
      }
    }

    async function handleSignal(msg: any) {
      if (msg.type === "room-status") {
        for (const peer of msg.peers || []) {
          if (id < peer.id) await offer(peer.id);
        }
        return;
      }
      if (msg.type === "peer-joined" && msg.peer?.id) {
        if (id < msg.peer.id) await offer(msg.peer.id);
        return;
      }
      if (msg.type === "peer-left" && msg.id) {
        pcs.get(msg.id)?.close();
        pcs.delete(msg.id);
        channels.delete(msg.id);
        ice.delete(msg.id);
        return;
      }
      if (!msg.from || !msg.data) return;
      const peerId = msg.from;

      if (msg.type === "offer") {
        const pc = makePC(peerId);
        await pc.setRemoteDescription(msg.data);
        for (const candidate of ice.get(peerId) || []) await pc.addIceCandidate(candidate);
        ice.delete(peerId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) signal("answer", peerId, pc.localDescription.toJSON());
      } else if (msg.type === "answer") {
        const pc = pcs.get(peerId);
        if (!pc) return;
        await pc.setRemoteDescription(msg.data);
        for (const candidate of ice.get(peerId) || []) await pc.addIceCandidate(candidate);
        ice.delete(peerId);
      } else if (msg.type === "ice-candidate") {
        const pc = pcs.get(peerId);
        if (pc?.remoteDescription) await pc.addIceCandidate(msg.data);
        else ice.set(peerId, [...(ice.get(peerId) || []), msg.data]);
      }
    }

    async function start() {
      await loadManifest();
      if (stopped) return;

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/p2p-sw.js")
          .then(() => log("Service worker de caché registrado"))
          .catch((error) => log("Service worker:", error));
      }

      ws = new WebSocket(SIGNAL);
      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: "join", room: ROOM, id }));
        log("Unido a la sala pública P2P");
      };
      ws.onmessage = (event) => {
        try { void handleSignal(JSON.parse(String(event.data))); }
        catch (error) { log("Error de señalización:", error); }
      };
      ws.onerror = () => log("Error de señalización WebSocket");
      ws.onclose = () => {
        if (!stopped) {
          log("Señalización desconectada; reintentando en 5 segundos");
          window.setTimeout(() => { if (!stopped) void start(); }, 5000);
        }
      };
    }

    void start();
    return () => {
      stopped = true;
      ws?.close();
      for (const pc of pcs.values()) pc.close();
      pcs.clear();
      channels.clear();
    };
  }, []);

  return null;
}

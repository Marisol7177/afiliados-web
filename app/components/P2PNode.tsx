"use client";

import { useEffect } from "react";

const SIGNAL = "wss://coinfactory-signaling.onrender.com";
const ROOM = "coinfactory-public";
const CACHE = "coinfactory-p2p-v2";

export default function P2PNode() {
  useEffect(() => {
    let stopped = false;
    let ws: WebSocket | null = null;
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    const pcs = new Map<string, RTCPeerConnection>();
    const stats = {
      peersConnected: 0,
      filesReceived: 0,
      bytesReceived: 0
    };

    function updateStats() {
      const snapshot = { ...stats };
      sessionStorage.setItem(
        "coinfactory-p2p-stats",
        JSON.stringify(snapshot)
      );
      window.dispatchEvent(
        new CustomEvent("coinfactory-p2p-stats", {
          detail: snapshot
        })
      );
    }
    const channels = new Map<string, RTCDataChannel>();
    const ice = new Map<string, RTCIceCandidateInit[]>();
    const transfers = new Map<string, {
      path: string; size: number; sha256: string;
      chunks: string[]; received: number;
    }>();
    let manifest: Array<{path:string;size:number;sha256:string}> = [];
    const pendingFetches = new Map<string, Array<{
      port: MessagePort;
      timer: number;
    }>>();

    function answerPending(path: string, ready: boolean) {
      const waiters = pendingFetches.get(path);
      if (!waiters) return;
      pendingFetches.delete(path);
      for (const waiter of waiters) {
        window.clearTimeout(waiter.timer);
        try {
          waiter.port.postMessage({ type: ready ? "P2P_READY" : "P2P_MISS" });
          waiter.port.close();
        } catch {}
      }
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      const msg = event.data;
      const port = event.ports?.[0];
      if (msg?.type !== "P2P_FETCH" || !port) return;

      const path = msg.path;
      if (typeof path !== "string" || !path.startsWith("/") ||
          path.startsWith("//")) {
        port.postMessage({ type: "P2P_MISS" });
        port.close();
        return;
      }

      const entry = manifest.find(resource => resource.path === path);
      if (!entry) {
        port.postMessage({ type: "P2P_MISS" });
        port.close();
        return;
      }

      void (async () => {
        const cache = await getCache();
        const cached = await cache.match(new URL(path, location.origin).href);
        if (cached?.headers.get("X-Coinfactory-P2P") === "verified") {
          port.postMessage({ type: "P2P_READY" });
          port.close();
          return;
        }

        const openChannels = [...channels.values()].filter(
          channel => channel.readyState === "open"
        );
        if (!openChannels.length) {
          port.postMessage({ type: "P2P_MISS" });
          port.close();
          return;
        }

        const waiters = pendingFetches.get(path) || [];
        const timer = window.setTimeout(() => {
          const current = pendingFetches.get(path);
          if (!current) return;
          const remaining = current.filter(item => item.port !== port);
          if (remaining.length) pendingFetches.set(path, remaining);
          else pendingFetches.delete(path);
          try {
            port.postMessage({ type: "P2P_MISS" });
            port.close();
          } catch {}
        }, 2500);

        waiters.push({ port, timer });
        pendingFetches.set(path, waiters);

        for (const channel of openChannels) {
          sendJSON(channel, {
            kind: "resource-request",
            path,
            sha256: entry.sha256
          });
        }
      })().catch(() => {
        try {
          port.postMessage({ type: "P2P_MISS" });
          port.close();
        } catch {}
      });
    }

    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage
    );

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
      const transferId = crypto.randomUUID();
      try {
        const entry = manifest.find((r) => r.path === path && r.sha256 === hash);
        if (!entry) return;

        const response = await fetch(path, {
      cache: "no-store",
      headers: { "X-Coinfactory-Origin-Only": "1" }
    });
        if (!response.ok) return;
        const buffer = await response.arrayBuffer();
        if (await sha256(buffer) !== hash) {
          log("Hash de origen incorrecto:", path);
          return;
        }

        sendJSON(channel, {
          kind: "resource-start", transferId, path, size: buffer.byteLength, sha256: hash
        });

        const bytes = new Uint8Array(buffer);
        const chunkSize = 12 * 1024;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          if (channel.readyState !== "open") return;
          const part = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
          let binary = "";
          for (let i = 0; i < part.length; i++) binary += String.fromCharCode(part[i]);
          sendJSON(channel, {
            kind: "resource-chunk", transferId, path, data: btoa(binary)
          });
          while (channel.bufferedAmount > 1024 * 1024) {
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
        }
        sendJSON(channel, { kind: "resource-end", transferId, path });
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
          typeof msg.transferId === "string" &&
          typeof msg.path === "string" &&
          typeof msg.sha256 === "string" &&
          Number.isSafeInteger(msg.size) && msg.size >= 0 &&
          msg.size <= 50 * 1024 * 1024) {
        transfers.set(`${peerId}:${msg.transferId}`, {
          path: msg.path, size: msg.size, sha256: msg.sha256,
          chunks: [], received: 0
        });
        return;
      }

      if (msg.kind === "resource-chunk" && typeof msg.transferId === "string" && typeof msg.data === "string") {
        const transfer = transfers.get(`${peerId}:${msg.transferId}`);
        if (!transfer) return;
        const binary = atob(msg.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        transfer.chunks.push(msg.data);
        transfer.received += bytes.length;
        return;
      }

      if (msg.kind === "resource-end" && typeof msg.transferId === "string") {
        const transfer = transfers.get(`${peerId}:${msg.transferId}`);
        if (!transfer) return;
        transfers.delete(`${peerId}:${msg.transferId}`);

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
          const extension = transfer.path.split("?")[0].split(".").pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            html: "text/html; charset=utf-8",
            css: "text/css; charset=utf-8",
            js: "text/javascript; charset=utf-8",
            mjs: "text/javascript; charset=utf-8",
            json: "application/json",
            txt: "text/plain; charset=utf-8",
            svg: "image/svg+xml",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            webp: "image/webp",
            avif: "image/avif",
            ico: "image/x-icon",
            woff: "font/woff",
            woff2: "font/woff2",
            ttf: "font/ttf",
            otf: "font/otf"
          };
          await cache.put(
            new URL(transfer.path, location.origin).href,
            new Response(buffer, {
              headers: {
                "Content-Type": mimeTypes[extension || ""] || "application/octet-stream",
                "X-Coinfactory-P2P": "verified"
              }
            })
          );
          stats.filesReceived++;
          stats.bytesReceived += buffer.byteLength;
          updateStats();
          answerPending(transfer.path, true);
          log("Recurso P2P verificado y guardado:", transfer.path);
        } catch (error) {
          log("Error verificando recurso:", error);
        }
      }
    }

    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" }
    ];

    async function loadTurnCredentials() {
      try {
        const response = await fetch(
          "https://coinfactory-signaling.onrender.com/turn-credentials",
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error(`TURN HTTP ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data.iceServers)) {
          throw new Error("Configuración ICE inválida");
        }

        iceServers = data.iceServers;
        log("Configuración TURN recibida");
      } catch (error) {
        log("TURN no disponible; usando STUN:", error);
      }
    }

    function makePC(peerId: string) {
      const existing = pcs.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({
        iceServers
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
        stats.peersConnected = [...channels.values()]
          .filter(c => c.readyState === "open").length;
        updateStats();
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

    let reconnectTimer: number | undefined;
    let reconnectAttempts = 0;
    let started = false;

    async function start() {
      if (stopped || started) return;
      started = true;

      try {
        if (manifest.length === 0) await loadManifest();
        await loadTurnCredentials();
      } catch (error) {
        log("Error preparando la conexión P2P:", error);
        started = false;
        if (!stopped && reconnectTimer === undefined) {
          const delay = Math.min(5000 * (2 ** reconnectAttempts), 60000);
          reconnectAttempts = Math.min(reconnectAttempts + 1, 4);
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = undefined;
            if (!stopped) void start();
          }, delay);
        }
        return;
      }
      if (stopped) {
        started = false;
        return;
      }

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
      ws.onerror = () => log("Error de señalización WebSocket", {
        readyState: ws?.readyState
      });
      ws.onclose = (event) => {
        log("WebSocket cerrado", {
          code: event.code,
          reason: event.reason || "(sin motivo)",
          wasClean: event.wasClean
        });
        started = false;
        if (!stopped && reconnectTimer === undefined) {
          const delay = Math.min(5000 * (2 ** reconnectAttempts), 60000);
          reconnectAttempts = Math.min(reconnectAttempts + 1, 4);
          log(`Señalización desconectada; reintento en ${Math.round(delay / 1000)} s`);
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = undefined;
            if (!stopped) void start();
          }, delay);
        }
      };
    }

    void start();
    return () => {
      stopped = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
      for (const [path, waiters] of pendingFetches) {
        for (const waiter of waiters) {
          window.clearTimeout(waiter.timer);
          try {
            waiter.port.postMessage({ type: "P2P_MISS" });
            waiter.port.close();
          } catch {}
        }
        pendingFetches.delete(path);
      }
      ws?.close();
      for (const pc of pcs.values()) pc.close();
      pcs.clear();
      channels.clear();
    };
  }, []);

  return null;
}

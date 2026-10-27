"use client";

import { useRef, useState } from "react";

const SIGNALING_URL = "wss://coinfactory-signaling.onrender.com";

type Peer = {
  id: string;
  state: string;
};

export default function LabPage() {
  const [room, setRoom] = useState("token-lab");
  const [status, setStatus] = useState("Desconectado");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [received, setReceived] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState("Ningún archivo seleccionado");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");
  const incomingFiles = useRef(new Map<string, { name: string; size: number; type: string; chunks: BlobPart[]; received: number }>());

  const nodeId = useRef(
    Math.random().toString(36).slice(2, 14)
  ).current;

  const wsRef = useRef<WebSocket | null>(null);
  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const channels = useRef(new Map<string, RTCDataChannel>());
  const pendingIce = useRef(
    new Map<string, RTCIceCandidateInit[]>()
  );

  function log(text: string) {
    setLogs((old) => [...old.slice(-29), text]);
  }

  function updatePeer(id: string, state: string) {
    setPeers((old) => {
      const found = old.some((peer) => peer.id === id);
      if (found) {
        return old.map((peer) =>
          peer.id === id ? { ...peer, state } : peer
        );
      }
      return [...old, { id, state }];
    });
  }

  function signal(type: string, target: string, data: unknown) {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      log("No se pudo enviar la señal: WebSocket desconectado.");
      return;
    }

    ws.send(JSON.stringify({ type, target, data }));
  }

  function setupChannel(channel: RTCDataChannel, peerId: string) {
    channels.current.set(peerId, channel);

    channel.onopen = () => {
      updatePeer(peerId, "Conectado P2P");
      log(`Canal de datos abierto con ${peerId}.`);
    };

    channel.onclose = () => {
      log(`Canal de datos cerrado con ${peerId}.`);
    };

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (
            msg &&
            typeof msg === "object" &&
            ["file-start", "file-chunk", "file-end"].includes(msg.kind)
          ) {
            handleFileMessage(event.data, peerId);
            return;
          }
        } catch {
          // Los mensajes de texto normales no son JSON de archivos.
        }
      }

      setReceived((old) => [
        ...old.slice(-49),
        `${peerId}: ${String(event.data)}`,
      ]);
    };
  }

  function sendFile() {
    if (!selectedFile) {
      setFileStatus("Selecciona primero un archivo.");
      return;
    }

    const openChannels = [...channels.current.values()].filter(
      (channel) => channel.readyState === "open"
    );

    if (!openChannels.length) {
      setFileStatus("No hay conexiones P2P abiertas.");
      return;
    }

    const fileId = crypto.randomUUID();
    const chunkSize = 16 * 1024;

    for (const channel of openChannels) {
      if (channel.bufferedAmount > 1024 * 1024) {
        setFileStatus("El canal está ocupado. Inténtalo de nuevo.");
        return;
      }
    }

    const reader = new FileReader();

    reader.onerror = () => {
      setFileStatus("No se pudo leer el archivo.");
    };

    reader.onload = () => {
      const buffer = reader.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setFileStatus("Error al preparar el archivo.");
        return;
      }

      for (const channel of openChannels) {
        channel.send(JSON.stringify({
          kind: "file-start",
          id: fileId,
          name: selectedFile.name,
          size: buffer.byteLength,
          type: selectedFile.type || "application/octet-stream",
        }));

        for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
          channel.send(JSON.stringify({
            kind: "file-chunk",
            id: fileId,
            data: Array.from(
              new Uint8Array(buffer.slice(offset, offset + chunkSize))
            ),
          }));
        }

        channel.send(JSON.stringify({
          kind: "file-end",
          id: fileId,
        }));
      }

      setFileStatus(
        `Archivo enviado: ${selectedFile.name} (${selectedFile.size} bytes).`
      );
      log(`Archivo enviado por P2P: ${selectedFile.name}.`);
    };

    setFileStatus("Preparando archivo…");
    reader.readAsArrayBuffer(selectedFile);
  }

  function handleFileMessage(data: unknown, peerId: string) {
    if (typeof data !== "string") {
      log(`Se recibió un bloque binario inesperado de ${peerId}.`);
      return;
    }

    let msg: {
      kind?: string;
      id?: string;
      name?: string;
      size?: number;
      type?: string;
      data?: number[];
    };

    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (!msg.id) return;

    if (msg.kind === "file-start") {
      if (
        typeof msg.name !== "string" ||
        typeof msg.size !== "number" ||
        msg.size < 0 ||
        msg.size > 20 * 1024 * 1024
      ) {
        log("Archivo rechazado: metadatos inválidos o supera 20 MB.");
        return;
      }

      incomingFiles.current.set(msg.id, {
        name: msg.name,
        size: msg.size,
        type: msg.type || "application/octet-stream",
        chunks: [],
        received: 0,
      });

      setFileStatus(`Recibiendo ${msg.name}…`);
      return;
    }

    const file = incomingFiles.current.get(msg.id);
    if (!file) return;

    if (msg.kind === "file-chunk" && Array.isArray(msg.data)) {
      const bytes = new Uint8Array(msg.data);
      file.chunks.push(bytes);
      file.received += bytes.byteLength;

      if (file.received > file.size) {
        incomingFiles.current.delete(msg.id);
        setFileStatus("Archivo rechazado: tamaño incorrecto.");
      }
      return;
    }

    if (msg.kind === "file-end") {
      incomingFiles.current.delete(msg.id);

      if (file.received !== file.size) {
        setFileStatus("Transferencia incompleta. Vuelve a intentarlo.");
        return;
      }

      const blob = new Blob(file.chunks, { type: file.type });
      const url = URL.createObjectURL(blob);

      setDownloadUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setDownloadName(file.name);
      setFileStatus(`Archivo recibido: ${file.name}. Ya puedes descargarlo.`);
      log(`Archivo recibido de ${peerId}: ${file.name}.`);
    }
  }

  function createPeerConnection(peerId: string) {
    const existing = pcs.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    pcs.current.set(peerId, pc);
    updatePeer(peerId, "Conectando…");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signal("ice-candidate", peerId, event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      updatePeer(peerId, pc.connectionState);
      log(`Conexión con ${peerId}: ${pc.connectionState}`);

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        channels.current.delete(peerId);
      }
    };

    pc.ondatachannel = (event) => {
      setupChannel(event.channel, peerId);
    };

    return pc;
  }

  async function flushIce(
    peerId: string,
    pc: RTCPeerConnection
  ) {
    const queued = pendingIce.current.get(peerId) || [];
    pendingIce.current.delete(peerId);

    for (const candidate of queued) {
      await pc.addIceCandidate(candidate);
    }
  }

  async function makeOffer(peerId: string) {
    try {
      const pc = createPeerConnection(peerId);

      if (pc.signalingState !== "stable") return;

      const channel = pc.createDataChannel("chat");
      setupChannel(channel, peerId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (pc.localDescription) {
        signal("offer", peerId, pc.localDescription.toJSON());
      }

      log(`Oferta WebRTC enviada a ${peerId}.`);
    } catch (error) {
      log(`Error al crear oferta: ${String(error)}`);
    }
  }

  async function handleSignal(msg: {
    type: string;
    from?: string;
    peers?: { id: string }[];
    peer?: { id: string };
    id?: string;
    data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
  }) {
    if (msg.type === "room-status") {
      const list = msg.peers || [];
      setPeers(list.map((peer) => ({
        id: peer.id,
        state: "En sala",
      })));

      log(`Sala lista. Otros participantes: ${list.length}.`);

      for (const peer of list) {
        if (nodeId < peer.id) {
          await makeOffer(peer.id);
        }
      }
      return;
    }

    if (msg.type === "peer-joined" && msg.peer) {
      const id = msg.peer.id;
      updatePeer(id, "En sala");
      log(`Se unió el participante ${id}.`);

      if (nodeId < id) {
        await makeOffer(id);
      }
      return;
    }

    if (msg.type === "peer-left" && msg.id) {
      const id = msg.id;
      pcs.current.get(id)?.close();
      pcs.current.delete(id);
      channels.current.delete(id);
      pendingIce.current.delete(id);
      setPeers((old) => old.filter((peer) => peer.id !== id));
      log(`El participante ${id} salió de la sala.`);
      return;
    }

    const from = msg.from;
    if (!from || !msg.data) return;

    if (msg.type === "offer") {
      const pc = createPeerConnection(from);

      await pc.setRemoteDescription(
        msg.data as RTCSessionDescriptionInit
      );
      await flushIce(from, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (pc.localDescription) {
        signal("answer", from, pc.localDescription.toJSON());
      }

      log(`Oferta recibida. Respuesta enviada a ${from}.`);
      return;
    }

    if (msg.type === "answer") {
      const pc = pcs.current.get(from);
      if (!pc) return;

      await pc.setRemoteDescription(
        msg.data as RTCSessionDescriptionInit
      );
      await flushIce(from, pc);
      log(`Respuesta WebRTC recibida de ${from}.`);
      return;
    }

    if (msg.type === "ice-candidate") {
      const candidate = msg.data as RTCIceCandidateInit;
      const pc = pcs.current.get(from);

      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        const queued = pendingIce.current.get(from) || [];
        queued.push(candidate);
        pendingIce.current.set(from, queued);
      }
    }
  }

  function connect() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const roomName = room.trim();

    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(roomName)) {
      setStatus("Nombre de sala no válido");
      return;
    }

    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;
    setStatus("Conectando al servidor…");
    log("Conectando con el servidor de señalización…");

    ws.onopen = () => {
      setStatus("Servidor conectado");
      ws.send(JSON.stringify({
        type: "join",
        room: roomName,
        id: nodeId,
      }));
      log(`Solicitando entrada a la sala "${roomName}".`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        void handleSignal(data).catch((error) => {
          log(`Error WebRTC: ${String(error)}`);
        });
      } catch {
        log("El servidor envió un mensaje no válido.");
      }
    };

    ws.onerror = () => {
      setStatus("Error de conexión");
      log("Error en el WebSocket.");
    };

    ws.onclose = () => {
      setStatus("Desconectado");
      log("Conexión con el servidor cerrada.");
    };
  }

  function disconnect() {
    wsRef.current?.close();
    wsRef.current = null;

    for (const pc of pcs.current.values()) {
      pc.close();
    }

    pcs.current.clear();
    channels.current.clear();
    pendingIce.current.clear();
    setPeers([]);
    setStatus("Desconectado");
    log("Desconectado.");
  }

  function sendMessage() {
    const text = message.trim();
    if (!text) return;

    let sent = false;

    for (const [peerId, channel] of channels.current.entries()) {
      if (channel.readyState === "open") {
        channel.send(text);
        sent = true;
      } else {
        log(`Canal con ${peerId} todavía no está abierto.`);
      }
    }

    if (sent) {
      setReceived((old) => [
        ...old.slice(-49),
        `Tú: ${text}`,
      ]);
      setMessage("");
    } else {
      log("Todavía no hay un canal P2P abierto.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-cyan-400 hover:underline">
          ← Volver a la página principal
        </a>

        <header className="py-8">
          <p className="font-mono text-cyan-400">
            TOKEN LAB / WEBRTC
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Laboratorio P2P
          </h1>
          <p className="mt-4 text-slate-300">
            Prueba una conexión directa entre navegadores con WebRTC.
            El servidor de señalización ayuda a establecer la conexión;
            los mensajes de prueba viajan por un canal de datos P2P.
          </p>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">1. Conectar a una sala</h2>

          <label className="mt-4 block text-sm text-slate-300">
            Nombre de la sala (usa el mismo en ambos navegadores)
          </label>
          <input
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            disabled={status !== "Desconectado"}
            className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3"
            placeholder="token-lab"
          />

          <p className="mt-3 break-all text-xs text-slate-400">
            Tu ID: {nodeId}
          </p>

          <p className="mt-3">
            Estado: <span className="font-semibold text-cyan-300">{status}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={connect}
              disabled={status !== "Desconectado"}
              className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold hover:bg-cyan-500 disabled:opacity-40"
            >
              Conectar
            </button>
            <button
              onClick={disconnect}
              className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
            >
              Desconectar
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold">2. Participantes P2P</h2>

          {peers.length === 0 ? (
            <p className="mt-3 text-slate-400">
              No hay otros participantes conectados.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {peers.map((peer) => (
                <li
                  key={peer.id}
                  className="break-all rounded-lg bg-slate-900 p-4"
                >
                  <p className="font-mono text-sm">{peer.id}</p>
                  <p className="mt-1 text-cyan-300">{peer.state}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold">3. Mensajes de prueba</h2>
          <p className="mt-2 text-sm text-slate-400">
            Cuando el canal P2P esté abierto, escribe un mensaje para enviarlo
            a los participantes conectados.
          </p>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 p-3"
              placeholder="Escribe un mensaje…"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold hover:bg-emerald-600"
            >
              Enviar P2P
            </button>
          </form>

          <div className="mt-4 max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-4">
            {received.length === 0 ? (
              <p className="text-sm text-slate-500">
                Los mensajes aparecerán aquí.
              </p>
            ) : (
              received.map((item, index) => (
                <p key={`${index}-${item}`} className="mb-2 break-words text-sm">
                  {item}
                </p>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">4. Transferencia de archivos P2P</h2>
          <p className="mt-2 text-sm text-slate-400">
            Selecciona un archivo de hasta 20 MB y envíalo a los participantes
            conectados directamente por WebRTC.
          </p>

          <input
            type="file"
            className="mt-4 block w-full text-sm text-slate-300"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setSelectedFile(file);
              setFileStatus(file ? `Seleccionado: ${file.name}` : "Ningún archivo seleccionado");
            }}
          />

          <button
            type="button"
            onClick={sendFile}
            disabled={!selectedFile || selectedFile.size > 20 * 1024 * 1024}
            className="mt-4 rounded-lg bg-cyan-700 px-5 py-3 font-semibold hover:bg-cyan-600 disabled:opacity-40"
          >
            Enviar archivo P2P
          </button>

          <p className="mt-3 break-words text-sm text-cyan-300">{fileStatus}</p>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadName}
              className="mt-4 inline-block rounded-lg bg-emerald-700 px-5 py-3 font-semibold hover:bg-emerald-600"
            >
              Descargar {downloadName}
            </a>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold">Registro de actividad</h2>
          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg bg-black p-4 font-mono text-xs text-slate-300">
            {logs.length === 0 ? (
              <p>Esperando actividad…</p>
            ) : (
              logs.map((item, index) => (
                <p key={`${index}-${item}`} className="mb-2 break-words">
                  {item}
                </p>
              ))
            )}
          </div>
        </section>

        <footer className="mt-8 border-t border-slate-800 pt-5 text-sm text-slate-400">
          WebRTC utiliza STUN para intentar establecer conexiones entre redes.
          Algunas redes pueden requerir un servidor TURN para conectar.
        </footer>
      </div>
    </main>
  );
}

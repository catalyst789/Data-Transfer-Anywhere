# Architecture

## How It Works

```
Browser A (Sender)                        Browser B (Receiver)
       │                                          │
       │── create-room ──▶  Signaling   ◀── join-room ──│
       │                     Server                      │
       │◀─────────────── peer-joined ─────────────────── │
       │                                                  │
       │◀══════════ WebRTC offer / answer / ICE ════════▶ │
       │                                                  │
       │══════════════ P2P DataChannel ═════════════════▶ │  ← 85–90% of connections
       │                                                  │
       │══════════════ via TURN relay ═══════════════════▶│  ← fallback (~10–15%)
```

1. **Sender** opens the site, emits `create-room` → server allocates a 6-char room ID and stores `senderId = socket.id` in memory.
2. **Receiver** opens `/join/:roomId` → server emits `peer-joined` to the sender.
3. **Sender** creates an `RTCPeerConnection`, opens a `DataChannel`, sends an SDP offer via the signaling server.
4. **Receiver** answers; ICE candidates are exchanged through the signaling server.
5. Once the DataChannel opens, the signaling server is out of the picture. Files stream directly between browsers.
6. If a direct path is blocked by NAT/firewall, traffic falls back to the TURN relay.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | Component model fits the room/peer/transfer state machine |
| Build | Vite | Fast HMR, minimal config |
| Styling | Tailwind CSS | Rapid UI without a component library |
| Animations | Framer Motion | `whileInView` stagger for the landing page |
| Routing | React Router v6 (data router) | `useBlocker` requires a data router for back-button protection |
| Signaling | Fastify + Socket.io | Non-blocking I/O; Socket.io handles WebSocket rooms natively |
| P2P Transport | WebRTC DataChannel | Built into every modern browser; DTLS-SRTP encrypted by spec |
| TURN relay | coturn | Open-source, self-hosted, industry standard |
| Reverse proxy | Nginx | SSL termination, WebSocket upgrade, static file serving |
| Containers | Docker + Docker Compose | One-command deployment |

---

## Project Structure

```
datatransfer/
├── client/                        React frontend
│   └── src/
│       ├── context/
│       │   └── SocketContext.tsx  Shared Socket.io instance — survives route transitions
│       │                          so the sender's socket ID stays stable across navigation
│       ├── hooks/
│       │   ├── useSignaling.ts    Wraps socket events (create-room, join-room, relay)
│       │   ├── useSenderRoom.ts   One RTCPeerConnection per receiver; broadcasts to all
│       │   └── useReceiverRoom.ts Single RTCPeerConnection to sender; auto-downloads files
│       ├── lib/
│       │   └── transfer.ts        16 KB chunk protocol, backpressure, FileReceiver state machine
│       ├── pages/
│       │   ├── HomePage.tsx       Landing page — hero, how-it-works, data info
│       │   ├── SenderPage.tsx     /send/:roomId — room management + useBlocker
│       │   └── ReceiverPage.tsx   /join/:roomId — auto-join on mount + useBlocker
│       ├── components/
│       │   ├── HowItWorks.tsx     Animated 3-step guide (Framer Motion whileInView)
│       │   ├── DataInfo.tsx       Data consumption table + requirements grid
│       │   ├── LeaveConfirm.tsx   Modal shown when useBlocker fires on back/navigate
│       │   ├── SenderRoom.tsx     QR code, peer list, file dropzone, text send
│       │   ├── ReceiverRoom.tsx   Connection status, received files, text messages
│       │   ├── FileDropzone.tsx   react-dropzone wrapper
│       │   ├── TransferList.tsx   Per-file progress bars with download links
│       │   └── PeerList.tsx       Connected device status indicators
│       └── types.ts               Shared TypeScript types
│
├── server/                        Fastify signaling server
│   └── src/
│       ├── server.ts              HTTP + Socket.io setup, CORS, event routing
│       └── rooms.ts               In-memory room map (create, join, cleanup on disconnect)
│
├── coturn/
│   └── turnserver.conf            TURN server config template
├── nginx/
│   └── nginx.conf                 Reverse proxy config (HTTP → HTTPS, WebSocket upgrade)
├── docker-compose.yml             Orchestrates server + coturn + nginx
├── docs/                          This documentation
└── .gitignore
```

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` | Landing page |
| `/send/:roomId` | `SenderPage` | Active sender session |
| `/join/:roomId` | `ReceiverPage` | Auto-joins room from URL (QR code lands here) |
| `*` | — | Redirects to `/` |

---

## File Transfer Protocol

Files are sent over a WebRTC `RTCDataChannel` (ordered, reliable — uses SCTP under the hood).

### Message format

```
Sender → Receiver (JSON):
  { type: "file-start", fileId, name, size, mimeType, totalChunks }

Sender → Receiver (ArrayBuffer, repeated):
  <raw 16 KB chunk>

Sender → Receiver (JSON):
  { type: "file-end", fileId }

Sender → Receiver (JSON, optional):
  { type: "text", content }
```

### Backpressure

Before sending each chunk the sender checks `dc.bufferedAmount`. If it exceeds 1 MB it polls every 50 ms until the buffer drains. This prevents the DataChannel from overflowing on large files or slow receivers.

### One-to-many

The sender maintains one `RTCPeerConnection` (and one `DataChannel`) per receiver. When sending a file, all DataChannels are written in parallel via `Promise.all`.

---

## Socket Lifecycle

The `SocketContext` creates a single `Socket.io` instance that persists across route changes. This is critical: the room on the server stores `senderId = socket.id`. If the socket were recreated on navigation (e.g. Home → SenderPage), the room would reference a stale socket ID and `peer-joined` events would never arrive.

React StrictMode double-invokes effects in development. The context handles this by using a `useState` lazy initializer (runs once per real mount) and reconnecting in the effect if StrictMode's phantom cleanup disconnected the socket.

---

## Signaling Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `create-room` | — | Create a new room; server responds with `room-created` |
| `join-room` | `{ roomId }` | Join an existing room |
| `relay` | `{ to, event, ...data }` | Forward a WebRTC signal to a specific peer |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-created` | `{ roomId }` | Room successfully created |
| `room-joined` | `{ roomId, senderId }` | Receiver successfully joined |
| `room-not-found` | — | Room ID does not exist |
| `room-closed` | — | Sender disconnected; room destroyed |
| `peer-joined` | `{ peerId }` | New receiver joined (sent to sender only) |
| `peer-left` | `{ peerId }` | Receiver disconnected (sent to sender only) |
| `relay` | `{ from, event, ...data }` | Forwarded WebRTC signal |

---

## Data & Privacy

| Scenario | Data used |
|---|---|
| Same WiFi / LAN | Zero internet data — WebRTC routes directly over the local network |
| Different networks | Equal to file size on both sender and receiver |
| Signaling server | ~3–5 KB per session (WebSocket handshake messages only) |
| TURN relay fallback | Equal to file size, routed through the relay server |

WebRTC DataChannels use **DTLS-SRTP** encryption by specification. All transfers are encrypted in transit regardless of whether the site itself uses HTTPS.

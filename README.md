# DataDrop

Peer-to-peer file transfer between any devices — no accounts, no server storage, no file size limits.

Files travel directly between browsers over WebRTC. The server only brokers the connection (~3–5 KB per session). Nothing is stored.

---

## Documentation

| Doc | Contents |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system works, tech stack, data flow, project structure, WebRTC protocol details |
| [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Running the project locally on macOS, Linux, and Windows |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to production — Docker Compose on VPS, manual setup, PaaS options |

---

## Quick Start

```bash
git clone <repo-url>
cd datatransfer

# Install dependencies
npm install --prefix server
npm install --prefix client

# Terminal 1 — signaling server
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open `http://localhost:5173`.

---

## Browser Support

| Browser | Min version |
|---|---|
| Chrome / Edge | 72+ |
| Firefox | 66+ |
| Safari | 14.1+ |
| iOS Safari | 14.5+ |
| Android Chrome | 72+ |

---

## License

MIT

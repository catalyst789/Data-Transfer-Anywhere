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

## Contributing

Contributions are welcome and greatly appreciated! Whether you're fixing bugs, improving documentation, enhancing the UI, optimizing performance, or proposing new features, your help makes DataDrop better for everyone.

### How to Contribute

1. **Fork the repository**

2. **Clone your fork**

   ```bash
   git clone https://github.com/<your-username>/Data-Transfer-Anywhere.git
   cd Data-Transfer-Anywhere
   ```

3. **Create a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**

5. **Test your changes locally**

6. **Commit using a clear commit message**

   ```bash
   git commit -m "feat: add transfer progress indicator"
   ```

7. **Push your branch**

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**

### Pull Request Guidelines

Before submitting a Pull Request, please ensure that:

* Your code builds successfully.
* Existing functionality is not broken.
* Changes are tested locally.
* Documentation is updated when necessary.
* The PR focuses on a single feature, fix, or improvement.
* Commit messages are clear and descriptive.

### PR Checklist

* [ ] Code builds successfully
* [ ] Changes tested locally
* [ ] Documentation updated (if applicable)
* [ ] No unrelated changes included
* [ ] Clear PR description provided

### Reporting Issues

Found a bug or have an idea for improvement?

Please open an issue and include:

* A clear description of the problem
* Steps to reproduce (for bugs)
* Expected and actual behavior
* Browser and operating system details
* Screenshots or logs when relevant

### Code Style

* Keep code readable and maintainable.
* Follow existing project conventions.
* Prefer small, focused pull requests over large changes.
* Add comments only when they improve understanding.

Thank you for helping improve DataDrop and making peer-to-peer file sharing better for everyone 🚀


## License

MIT

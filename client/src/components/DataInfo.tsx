import { motion } from 'framer-motion';

const dataRows = [
  {
    icon: '📶',
    scenario: 'Same WiFi / LAN',
    data: 'Zero internet data',
    detail: 'WebRTC routes directly over your local network. No bytes leave the router.',
    badge: 'text-green-400 bg-green-400/10',
  },
  {
    icon: '🌐',
    scenario: 'Different networks',
    data: 'Uses your internet plan',
    detail: 'Files travel over the internet between devices — both sides consume data equal to the file size.',
    badge: 'text-yellow-400 bg-yellow-400/10',
  },
  {
    icon: '📡',
    scenario: 'Signaling server only',
    data: '~3–5 KB per session',
    detail: 'The server only relays WebSocket handshakes (offer/answer/ICE). Your files never touch it.',
    badge: 'text-indigo-400 bg-indigo-400/10',
  },
  {
    icon: '🔄',
    scenario: 'TURN relay fallback',
    data: 'Equal to file size',
    detail: 'If a direct P2P path is blocked by a corporate firewall, a TURN relay is used — same data, different route.',
    badge: 'text-zinc-400 bg-zinc-400/10',
  },
];

const features = [
  { icon: '🔒', label: 'End-to-end encrypted', desc: 'WebRTC uses DTLS-SRTP by spec — always encrypted in transit.' },
  { icon: '👤', label: 'No accounts needed', desc: 'Open the page, create a room, done.' },
  { icon: '📦', label: 'Any file type & size', desc: 'PDFs, videos, ZIPs — no restrictions, no compression.' },
  { icon: '📱', label: 'Any device', desc: 'Chrome, Firefox, Safari, Edge — desktop, mobile, tablet.' },
  { icon: '⚡', label: 'Real-time progress', desc: 'Live progress bars per file, per receiver.' },
  { icon: '🗑️', label: 'Nothing stored', desc: 'No server storage. Rooms disappear when the sender leaves.' },
];

export function DataInfo() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12 space-y-14">
      {/* Data consumption table */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Will it use my mobile data?</h2>
          <p className="text-zinc-400 mt-2">Depends on your network — here's exactly how.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-zinc-700 overflow-hidden"
        >
          {dataRows.map((row, i) => (
            <div
              key={i}
              className={`flex gap-4 px-5 py-4 ${i !== dataRows.length - 1 ? 'border-b border-zinc-800' : ''} hover:bg-zinc-800/40 transition-colors`}
            >
              <span className="text-2xl mt-0.5 shrink-0">{row.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-200">{row.scenario}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.badge}`}>
                    {row.data}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{row.detail}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Requirements */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Requirements</h2>
          <p className="text-zinc-400 mt-2">Nothing to install. Just a browser.</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{f.label}</div>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-5 py-4 text-center"
        >
          <p className="text-sm text-zinc-400">
            <span className="text-white font-medium">Browser support:</span> Chrome 72+, Firefox 66+, Safari 14.1+, Edge 79+{' '}
            <span className="text-zinc-500">· iOS Safari, Android Chrome fully supported</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

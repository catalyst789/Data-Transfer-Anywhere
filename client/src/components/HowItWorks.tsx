import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    emoji: '🖥️',
    title: 'Create a Room',
    desc: 'Click "Send Files" — a unique 6-character room code and scannable QR code are generated instantly. No sign-up needed.',
    color: 'border-indigo-500/40 bg-indigo-950/30',
    badge: 'bg-indigo-500',
  },
  {
    number: '02',
    emoji: '📲',
    title: 'Share the Code',
    desc: 'Share the code or let receivers scan the QR. Works on any phone, tablet, or laptop — any OS, any modern browser.',
    color: 'border-violet-500/40 bg-violet-950/30',
    badge: 'bg-violet-500',
  },
  {
    number: '03',
    emoji: '⚡',
    title: 'Transfer Instantly',
    desc: 'Drag & drop files or paste text. All connected devices receive them in real time — files travel directly between devices.',
    color: 'border-purple-500/40 bg-purple-950/30',
    badge: 'bg-purple-500',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const card = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function HowItWorks() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white">How it works</h2>
        <p className="text-zinc-400 mt-2">Three steps. No installs. No accounts.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid md:grid-cols-3 gap-6 relative"
      >
        {/* Connector lines between cards (desktop only) */}
        <div className="hidden md:flex absolute inset-0 items-center pointer-events-none px-[calc(33%-1rem)]">
          <div className="flex-1 border-t-2 border-dashed border-zinc-700" />
        </div>

        {steps.map((s) => (
          <motion.div
            key={s.number}
            variants={card}
            className={`relative rounded-2xl border p-6 ${s.color}`}
          >
            <span
              className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded-full mb-4 ${s.badge}`}
            >
              {s.number}
            </span>
            <div className="text-4xl mb-3">{s.emoji}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Animated demo strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-10 flex items-center justify-center gap-3 text-sm text-zinc-500"
      >
        <span className="font-mono bg-zinc-800 px-3 py-1 rounded-lg text-zinc-300 tracking-widest">
          XXXXXX
        </span>
        <motion.span
          animate={{ x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="text-indigo-400 text-lg"
        >
          →
        </motion.span>
        <span className="text-zinc-400">Any device, anywhere</span>
        <motion.span
          animate={{ x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
          className="text-indigo-400 text-lg"
        >
          →
        </motion.span>
        <span className="text-green-400 font-medium">Files arrive ✓</span>
      </motion.div>
    </section>
  );
}

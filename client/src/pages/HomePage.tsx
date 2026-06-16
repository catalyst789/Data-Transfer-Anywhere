import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSignaling } from '../hooks/useSignaling';
import { HowItWorks } from '../components/HowItWorks';
import { DataInfo } from '../components/DataInfo';

export function HomePage() {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const { connected, createRoom, joinRoom } = useSignaling({
    onRoomCreated: (roomId) => navigate(`/send/${roomId}`),
    onRoomJoined: (roomId) => navigate(`/join/${roomId}`),
    onRoomNotFound: () => {
      setError('Room not found. Check the code and try again.');
      setCreating(false);
    },
  });

  // Legacy deep-link: ?room=XXXXXX → redirect to /join/:roomId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) navigate(`/join/${room.toUpperCase()}`, { replace: true });
  }, [navigate]);

  const handleCreate = () => {
    setError('');
    setCreating(true);
    createRoom();
  };

  const handleJoin = () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) { setError('Room code must be 6 characters.'); return; }
    setError('');
    joinRoom(code);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-20 pb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-6xl font-extrabold tracking-tight text-white"
        >
          DataDrop
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-zinc-400 mt-3 text-lg"
        >
          Transfer files between any devices — instantly, privately.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 mt-2"
        >
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-zinc-600 animate-pulse'}`} />
          <span className="text-xs text-zinc-500">{connected ? 'Connected to server' : 'Connecting…'}</span>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="grid sm:grid-cols-2 gap-5 mt-10"
        >
          {/* Create room */}
          <div className="bg-zinc-800 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div>
              <h2 className="text-lg font-semibold text-white">Send files</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Create a room and share the code with receivers.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={!connected || creating}
              className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl font-medium transition-colors"
            >
              {creating ? 'Creating…' : 'Create Room'}
            </button>
          </div>

          {/* Join room */}
          <div className="bg-zinc-800 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div>
              <h2 className="text-lg font-semibold text-white">Receive files</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Enter the 6-character room code from the sender.
              </p>
            </div>
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="XXXXXX"
              maxLength={6}
              className="bg-zinc-700 rounded-xl px-4 py-3 text-center font-mono text-xl tracking-widest text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleJoin}
              disabled={!connected || joinInput.length !== 6}
              className="w-full py-3 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-40 rounded-xl font-medium transition-colors"
            >
              Join Room
            </button>
          </div>
        </motion.div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          No accounts · No storage · Files flow directly between devices via WebRTC
        </p>
      </section>

      <HowItWorks />
      <DataInfo />

      <footer className="text-center text-zinc-700 text-xs py-10 border-t border-zinc-800">
        DataDrop — open, private, ephemeral file transfer
      </footer>
    </div>
  );
}

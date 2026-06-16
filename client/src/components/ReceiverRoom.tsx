import type { TransferItem } from '../types';
import { TransferList } from './TransferList';

interface Props {
  roomId: string;
  connected: boolean;
  transfers: TransferItem[];
  texts: string[];
}

export function ReceiverRoom({ roomId, connected, transfers, texts }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-xl p-6 text-center">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Joined Room</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-white">{roomId}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}
          />
          <span className="text-sm text-zinc-400">
            {connected ? 'Connected to sender' : 'Establishing connection…'}
          </span>
        </div>
      </div>

      {texts.length > 0 && (
        <section>
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Received Text</h2>
          <ul className="space-y-2">
            {texts.map((t, i) => (
              <li key={i} className="bg-zinc-800 rounded-lg px-4 py-3">
                <p className="text-sm text-zinc-200 break-all">{t}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(t)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {transfers.length > 0 ? (
        <section>
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
            Received Files
          </h2>
          <TransferList transfers={transfers} />
        </section>
      ) : (
        <p className="text-zinc-500 text-sm text-center py-8">
          Waiting for the sender to share files…
        </p>
      )}
    </div>
  );
}

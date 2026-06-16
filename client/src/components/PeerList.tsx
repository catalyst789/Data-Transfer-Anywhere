import type { PeerInfo } from '../types';

interface Props {
  peers: PeerInfo[];
}

const statusColor: Record<PeerInfo['status'], string> = {
  connecting: 'bg-yellow-400',
  connected: 'bg-green-400',
  disconnected: 'bg-zinc-500',
};

export function PeerList({ peers }: Props) {
  if (peers.length === 0)
    return (
      <p className="text-zinc-500 text-sm text-center py-4">
        No devices connected yet. Share the room code.
      </p>
    );

  return (
    <ul className="space-y-2">
      {peers.map((p) => (
        <li key={p.peerId} className="flex items-center gap-3 bg-zinc-800 rounded-lg px-4 py-3">
          <span className={`w-2 h-2 rounded-full ${statusColor[p.status]}`} />
          <span className="text-sm text-zinc-300 font-mono">{p.peerId.slice(0, 8)}</span>
          <span className="text-xs text-zinc-500 ml-auto capitalize">{p.status}</span>
        </li>
      ))}
    </ul>
  );
}

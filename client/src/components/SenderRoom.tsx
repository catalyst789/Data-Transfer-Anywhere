import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { PeerInfo, TransferItem } from '../types';
import { FileDropzone } from './FileDropzone';
import { TransferList } from './TransferList';
import { PeerList } from './PeerList';

interface Props {
  roomId: string;
  peers: PeerInfo[];
  transfers: TransferItem[];
  onSendFiles: (files: File[]) => void;
  onSendText: (text: string) => void;
}

export function SenderRoom({ roomId, peers, transfers, onSendFiles, onSendText }: Props) {
  const [text, setText] = useState('');
  const roomUrl = `${window.location.origin}/join/${roomId}`;
  const connectedCount = peers.filter((p) => p.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Room code + QR */}
      <div className="bg-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="flex-1">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Room Code</p>
          <p className="text-4xl font-mono font-bold tracking-widest text-white">{roomId}</p>
          <p className="text-zinc-500 text-xs mt-2">
            Share this code with receivers · {connectedCount} device
            {connectedCount !== 1 ? 's' : ''} connected
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(roomUrl)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Copy join link
          </button>
        </div>
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={roomUrl} size={120} />
        </div>
      </div>

      {/* Connected peers */}
      <section>
        <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Connected Devices</h2>
        <PeerList peers={peers} />
      </section>

      {/* File drop */}
      <section>
        <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Send Files</h2>
        <FileDropzone onFiles={onSendFiles} disabled={connectedCount === 0} />
      </section>

      {/* Text send */}
      <section>
        <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Send Text</h2>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text or paste a link…"
            className="flex-1 bg-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => { onSendText(text); setText(''); }}
            disabled={!text.trim() || connectedCount === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </section>

      {/* Transfer progress */}
      {transfers.length > 0 && (
        <section>
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Transfers</h2>
          <TransferList transfers={transfers} />
        </section>
      )}
    </div>
  );
}

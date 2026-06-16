import { useCallback, useRef, useState } from 'react';
import type { FileMeta, TransferItem } from '../types';
import { FileReceiver } from '../lib/transfer';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Production: add your TURN server here
    // { urls: 'turn:your-server.com:3478', username: '...', credential: '...' }
  ],
};

export function useReceiverRoom(relay: (to: string, data: Record<string, unknown>) => void) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const senderIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [texts, setTexts] = useState<string[]>([]);

  const init = useCallback(
    (senderId: string) => {
      senderIdRef.current = senderId;
      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) relay(senderId, { event: 'ice-candidate', candidate });
      };

      pc.ondatachannel = ({ channel }) => {
        const receiver = new FileReceiver();

        receiver.onProgress = (fileId, pct) => {
          setTransfers((prev) =>
            prev.map((t) =>
              t.fileId === fileId ? { ...t, progress: pct, status: 'transferring' } : t,
            ),
          );
        };

        receiver.onFileComplete = (meta: FileMeta, blob: Blob) => {
          const url = URL.createObjectURL(blob);
          setTransfers((prev) =>
            prev.map((t) =>
              t.fileId === meta.fileId
                ? { ...t, progress: 100, status: 'done', downloadUrl: url }
                : t,
            ),
          );
          // Auto-trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = meta.name;
          a.click();
        };

        receiver.onText = (content) => setTexts((prev) => [...prev, content]);

        channel.onopen = () => setConnected(true);
        channel.onclose = () => setConnected(false);
        channel.onmessage = ({ data }) => {
          // Register new file-start before passing to receiver so UI shows it
          if (typeof data === 'string') {
            try {
              const msg = JSON.parse(data as string);
              if (msg.type === 'file-start') {
                setTransfers((prev) => [
                  ...prev,
                  {
                    fileId: msg.fileId,
                    name: msg.name,
                    size: msg.size,
                    progress: 0,
                    status: 'transferring',
                  },
                ]);
              }
            } catch {
              // not JSON — ignore
            }
          }
          receiver.receive(data as string | ArrayBuffer);
        };
      };
    },
    [relay],
  );

  // Handle signaling messages from sender (relayed via server)
  const handleRelay = useCallback(async (from: string, data: Record<string, unknown>) => {
    const pc = pcRef.current;
    if (!pc || from !== senderIdRef.current) return;

    if (data.event === 'offer') {
      await pc.setRemoteDescription(
        new RTCSessionDescription(data.sdp as RTCSessionDescriptionInit),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      relay(from, { event: 'answer', sdp: pc.localDescription });
    } else if (data.event === 'ice-candidate' && data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit));
    }
  }, [relay]);

  const disconnect = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    setConnected(false);
  }, []);

  return { connected, transfers, texts, init, handleRelay, disconnect };
}

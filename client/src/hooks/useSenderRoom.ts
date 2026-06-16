import { useCallback, useRef, useState } from 'react';
import type { PeerInfo, TransferItem } from '../types';
import { sendFile, sendText } from '../lib/transfer';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Production: add your TURN server here
    // { urls: 'turn:your-server.com:3478', username: '...', credential: '...' }
  ],
};

interface PeerEntry {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
}

export function useSenderRoom(relay: (to: string, data: Record<string, unknown>) => void) {
  const peers = useRef<Map<string, PeerEntry>>(new Map());
  const [peerList, setPeerList] = useState<PeerInfo[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);

  const updatePeer = useCallback((peerId: string, status: PeerInfo['status']) => {
    setPeerList((prev) => {
      const exists = prev.find((p) => p.peerId === peerId);
      if (!exists) return [...prev, { peerId, status }];
      return prev.map((p) => (p.peerId === peerId ? { ...p, status } : p));
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    peers.current.get(peerId)?.pc.close();
    peers.current.delete(peerId);
    setPeerList((prev) => prev.filter((p) => p.peerId !== peerId));
  }, []);

  // Called when server says a new receiver joined — sender initiates the offer
  const addPeer = useCallback(
    async (peerId: string) => {
      const pc = new RTCPeerConnection(ICE_CONFIG);
      const dc = pc.createDataChannel('transfer', { ordered: true });
      peers.current.set(peerId, { pc, dc });
      updatePeer(peerId, 'connecting');

      dc.onopen = () => updatePeer(peerId, 'connected');
      dc.onclose = () => updatePeer(peerId, 'disconnected');

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) relay(peerId, { event: 'ice-candidate', candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      relay(peerId, { event: 'offer', sdp: pc.localDescription });
    },
    [relay, updatePeer],
  );

  // Handle incoming signaling messages relayed from receivers
  const handleRelay = useCallback(
    async (from: string, data: Record<string, unknown>) => {
      const entry = peers.current.get(from);
      if (!entry) return;
      const { pc } = entry;

      if (data.event === 'answer') {
        await pc.setRemoteDescription(
          new RTCSessionDescription(data.sdp as RTCSessionDescriptionInit),
        );
      } else if (data.event === 'ice-candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit));
      }
    },
    [],
  );

  const updateTransferProgress = (fileId: string, name: string, size: number, pct: number) => {
    setTransfers((prev) => {
      const exists = prev.find((t) => t.fileId === fileId);
      if (!exists)
        return [
          ...prev,
          { fileId, name, size, progress: pct, status: pct === 100 ? 'done' : 'transferring' },
        ];
      return prev.map((t) =>
        t.fileId === fileId ? { ...t, progress: pct, status: pct === 100 ? 'done' : 'transferring' } : t,
      );
    });
  };

  // Send files to ALL connected peers simultaneously
  const sendFiles = useCallback(async (files: File[]) => {
    const connectedPeers = [...peers.current.entries()].filter(
      ([, { dc }]) => dc?.readyState === 'open',
    );
    if (connectedPeers.length === 0) return;

    for (const file of files) {
      const fileId = Math.random().toString(36).slice(2, 10);
      setTransfers((prev) => [
        ...prev,
        { fileId, name: file.name, size: file.size, progress: 0, status: 'transferring' },
      ]);

      // Broadcast to all peers in parallel
      await Promise.all(
        connectedPeers.map(([, { dc }]) =>
          sendFile(dc!, file, (pct) => updateTransferProgress(fileId, file.name, file.size, pct)),
        ),
      );
    }
  }, []);

  const sendTextToAll = useCallback((content: string) => {
    for (const { dc } of peers.current.values()) {
      if (dc?.readyState === 'open') sendText(dc, content);
    }
  }, []);

  const isActive =
    peerList.some((p) => p.status === 'connected' || p.status === 'connecting') ||
    transfers.some((t) => t.status === 'transferring');

  return { peerList, transfers, isActive, addPeer, removePeer, handleRelay, sendFiles, sendTextToAll };
}

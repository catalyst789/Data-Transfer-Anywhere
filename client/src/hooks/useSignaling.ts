import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export interface SignalingHandlers {
  onRoomCreated?: (roomId: string) => void;
  onRoomJoined?: (roomId: string, senderId: string) => void;
  onRoomNotFound?: () => void;
  onRoomClosed?: () => void;
  onPeerJoined?: (peerId: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onRelay?: (from: string, data: Record<string, unknown>) => void;
}

export function useSignaling(handlers: SignalingHandlers) {
  const socket = useSocket();
  const [connected, setConnected] = useState(socket.connected);
  // Keep handlers in a ref so we don't re-subscribe on every render
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    // Sync immediately in case socket already connected before this effect ran
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('room-created', ({ roomId }: { roomId: string }) =>
      handlersRef.current.onRoomCreated?.(roomId),
    );
    socket.on('room-joined', ({ roomId, senderId }: { roomId: string; senderId: string }) =>
      handlersRef.current.onRoomJoined?.(roomId, senderId),
    );
    socket.on('room-not-found', () => handlersRef.current.onRoomNotFound?.());
    socket.on('room-closed', () => handlersRef.current.onRoomClosed?.());
    socket.on('peer-joined', ({ peerId }: { peerId: string }) =>
      handlersRef.current.onPeerJoined?.(peerId),
    );
    socket.on('peer-left', ({ peerId }: { peerId: string }) =>
      handlersRef.current.onPeerLeft?.(peerId),
    );
    socket.on('relay', ({ from, ...data }: { from: string; [key: string]: unknown }) =>
      handlersRef.current.onRelay?.(from, data),
    );

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-not-found');
      socket.off('room-closed');
      socket.off('peer-joined');
      socket.off('peer-left');
      socket.off('relay');
    };
  }, [socket]);

  const createRoom = () => socket.emit('create-room');

  const joinRoom = (roomId: string) =>
    socket.emit('join-room', { roomId: roomId.toUpperCase() });

  const relay = (to: string, data: Record<string, unknown>) =>
    socket.emit('relay', { to, ...data });

  return { connected, createRoom, joinRoom, relay };
}

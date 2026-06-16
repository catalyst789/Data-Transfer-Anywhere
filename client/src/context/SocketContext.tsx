import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const SocketCtx = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // useState lazy initializer: socket state survives StrictMode double-render.
  // The effect reconnects if StrictMode's phantom cleanup disconnected the socket.
  const [socket] = useState<Socket>(() => io(SERVER_URL));

  useEffect(() => {
    if (!socket.connected) socket.connect();
    return () => { socket.disconnect(); };
  }, [socket]);

  return <SocketCtx.Provider value={socket}>{children}</SocketCtx.Provider>;
}

export function useSocket(): Socket {
  const s = useContext(SocketCtx);
  if (!s) throw new Error('useSocket must be inside SocketProvider');
  return s;
}

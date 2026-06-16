import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { createRoom, getRoom, addReceiver, removeSocket } from './rooms';

const PORT = Number(process.env.PORT) || 3001;
const RAW_ORIGINS = process.env.CLIENT_URL || 'http://localhost:5173,http://192.168.1.6:5173';
const ALLOWED_ORIGINS = RAW_ORIGINS.split(',').map((o) => o.trim());

const app = Fastify({ logger: false });
app.register(cors, { origin: ALLOWED_ORIGINS });

app.get('/health', async () => ({ status: 'ok' }));

// Socket.io attaches to the same underlying http server as Fastify
const io = new SocketIOServer(app.server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

// Signaling events
// client → server: create-room, join-room, relay (offer/answer/ice)
// server → client: room-created, room-not-found, peer-joined, peer-left, relay, room-closed

io.on('connection', (socket) => {
  // Sender creates a room and becomes the host
  socket.on('create-room', () => {
    const room = createRoom(socket.id);
    socket.join(room.id);
    socket.emit('room-created', { roomId: room.id });
  });

  // Receiver joins an existing room
  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId);
    if (!room || !room.senderId) {
      socket.emit('room-not-found');
      return;
    }
    addReceiver(roomId, socket.id);
    socket.join(roomId);
    socket.emit('room-joined', { roomId, senderId: room.senderId });
    // Tell the sender a new receiver arrived so it can initiate WebRTC
    io.to(room.senderId).emit('peer-joined', { peerId: socket.id });
  });

  // Relay WebRTC signaling messages (offer / answer / ice-candidate)
  // Payload: { to: socketId, ...signalingData }
  socket.on('relay', ({ to, ...data }: { to: string; [key: string]: unknown }) => {
    io.to(to).emit('relay', { from: socket.id, ...data });
  });

  socket.on('disconnect', () => {
    const result = removeSocket(socket.id);
    if (!result) return;

    if (result.wasSender) {
      // Sender left — close the room for all receivers
      io.to(result.roomId).emit('room-closed');
      io.socketsLeave(result.roomId);
    } else {
      // Receiver left — notify sender
      const room = getRoom(result.roomId);
      if (room?.senderId) {
        io.to(room.senderId).emit('peer-left', { peerId: socket.id });
      }
    }
  });
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Signaling server running on port ${PORT}`);
});

export interface Room {
  id: string;
  senderId: string | null;
  receivers: Set<string>;
}

const rooms = new Map<string, Room>();

function generateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,I,1)
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function createRoom(senderId: string): Room {
  let id = generateId();
  while (rooms.has(id)) id = generateId();
  const room: Room = { id, senderId, receivers: new Set() };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function addReceiver(roomId: string, socketId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.receivers.add(socketId);
  return true;
}

export function removeSocket(socketId: string): { roomId: string; wasSender: boolean } | null {
  for (const [roomId, room] of rooms) {
    if (room.senderId === socketId) {
      rooms.delete(roomId);
      return { roomId, wasSender: true };
    }
    if (room.receivers.has(socketId)) {
      room.receivers.delete(socketId);
      return { roomId, wasSender: false };
    }
  }
  return null;
}

export function getRoomBySender(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.senderId === socketId) return room;
  }
  return undefined;
}

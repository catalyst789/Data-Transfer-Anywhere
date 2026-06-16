import { useEffect } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useSignaling } from '../hooks/useSignaling';
import { useReceiverRoom } from '../hooks/useReceiverRoom';
import { ReceiverRoom } from '../components/ReceiverRoom';
import { LeaveConfirm } from '../components/LeaveConfirm';

export function ReceiverPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const receiverRoom = useReceiverRoom((to, data) => relay(to, data));

  const { connected, joinRoom, relay } = useSignaling({
    onRoomJoined: (_roomId, senderId) => receiverRoom.init(senderId),
    onRoomNotFound: () => navigate('/?error=room-not-found', { replace: true }),
    onRoomClosed: () => {
      receiverRoom.disconnect();
      navigate('/', { replace: true });
    },
    onRelay: (from, data) => receiverRoom.handleRelay(from, data),
  });

  // Auto-join the room from URL param once connected
  useEffect(() => {
    if (connected && roomId) joinRoom(roomId);
  }, [connected, roomId, joinRoom]);

  // Block navigation while receiving
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      receiverRoom.connected && currentLocation.pathname !== nextLocation.pathname,
  );

  // Warn on tab close while connected
  useEffect(() => {
    if (!receiverRoom.connected) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [receiverRoom.connected]);

  if (!roomId) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                receiverRoom.connected
                  ? 'bg-green-400'
                  : connected
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-zinc-600 animate-pulse'
              }`}
            />
            <span className="text-xs text-zinc-500">
              {receiverRoom.connected ? 'Connected to sender' : connected ? 'Joining room…' : 'Connecting…'}
            </span>
          </div>
        </div>

        <ReceiverRoom
          roomId={roomId}
          connected={receiverRoom.connected}
          transfers={receiverRoom.transfers}
          texts={receiverRoom.texts}
        />
      </div>

      {blocker.state === 'blocked' && (
        <LeaveConfirm
          message="You will be disconnected from the sender and won't receive any more files."
          onStay={() => blocker.reset()}
          onLeave={() => blocker.proceed()}
        />
      )}
    </div>
  );
}

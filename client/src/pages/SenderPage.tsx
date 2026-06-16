import { useEffect } from 'react';
import { useNavigate, useBlocker, useParams } from 'react-router-dom';
import { useSignaling } from '../hooks/useSignaling';
import { useSenderRoom } from '../hooks/useSenderRoom';
import { SenderRoom } from '../components/SenderRoom';
import { LeaveConfirm } from '../components/LeaveConfirm';

export function SenderPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const senderRoom = useSenderRoom((to, data) => relay(to, data));

  const { connected, relay } = useSignaling({
    onRoomClosed: () => navigate('/', { replace: true }),
    onPeerJoined: (peerId) => senderRoom.addPeer(peerId),
    onPeerLeft: (peerId) => senderRoom.removePeer(peerId),
    onRelay: (from, data) => senderRoom.handleRelay(from, data),
  });

  // Block browser back/navigate away when session is active
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      senderRoom.isActive && currentLocation.pathname !== nextLocation.pathname,
  );

  // Warn on tab close / refresh during active session
  useEffect(() => {
    if (!senderRoom.isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [senderRoom.isActive]);

  if (!roomId) {
    navigate('/', { replace: true });
    return null;
  }

  const connectedCount = senderRoom.peerList.filter((p) => p.status === 'connected').length;
  const transferringCount = senderRoom.transfers.filter((t) => t.status === 'transferring').length;

  const leaveMessage =
    transferringCount > 0
      ? `${transferringCount} transfer${transferringCount > 1 ? 's' : ''} in progress. Leaving will cancel them and disconnect all receivers.`
      : `${connectedCount} device${connectedCount !== 1 ? 's' : ''} connected. Leaving will close the room for everyone.`;

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
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs text-zinc-500">{connected ? 'Live' : 'Connecting…'}</span>
          </div>
        </div>

        <SenderRoom
          roomId={roomId}
          peers={senderRoom.peerList}
          transfers={senderRoom.transfers}
          onSendFiles={senderRoom.sendFiles}
          onSendText={senderRoom.sendTextToAll}
        />
      </div>

      {blocker.state === 'blocked' && (
        <LeaveConfirm
          message={leaveMessage}
          onStay={() => blocker.reset()}
          onLeave={() => blocker.proceed()}
        />
      )}
    </div>
  );
}

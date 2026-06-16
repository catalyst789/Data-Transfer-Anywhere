interface Props {
  message: string;
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveConfirm({ message, onStay, onLeave }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-3xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold text-white mb-2">Leave this room?</h2>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium text-zinc-300 transition-colors"
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}

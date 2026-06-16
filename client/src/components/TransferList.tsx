import type { TransferItem } from '../types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

interface Props {
  transfers: TransferItem[];
}

export function TransferList({ transfers }: Props) {
  if (transfers.length === 0) return null;

  return (
    <ul className="space-y-3">
      {transfers.map((t) => (
        <li key={t.fileId} className="bg-zinc-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-200 truncate max-w-[60%]">{t.name}</span>
            <span className="text-xs text-zinc-500">{formatBytes(t.size)}</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-150 ${
                t.status === 'done' ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${t.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-zinc-500">
              {t.status === 'done' ? 'Complete' : t.status === 'queued' ? 'Queued' : `${t.progress}%`}
            </span>
            {t.downloadUrl && (
              <a
                href={t.downloadUrl}
                download={t.name}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Download again
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

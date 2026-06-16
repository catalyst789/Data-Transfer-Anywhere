import type { ChannelMessage, FileMeta } from '../types';

export const CHUNK_SIZE = 16 * 1024; // 16KB — safe DataChannel chunk size
const BUFFER_HIGH_WATER = 1024 * 1024; // pause sending above 1MB buffered

export function totalChunks(fileSize: number): number {
  return Math.ceil(fileSize / CHUNK_SIZE) || 1;
}

export function generateFileId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Send a single file over a DataChannel with backpressure handling. */
export async function sendFile(
  dc: RTCDataChannel,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  const fileId = generateFileId();
  const chunks = totalChunks(file.size);

  const meta: ChannelMessage = {
    type: 'file-start',
    fileId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    totalChunks: chunks,
  };
  dc.send(JSON.stringify(meta));

  let offset = 0;
  let chunkIndex = 0;

  while (offset < file.size) {
    // Backpressure: wait if the send buffer is too full
    if (dc.bufferedAmount > BUFFER_HIGH_WATER) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (dc.bufferedAmount <= BUFFER_HIGH_WATER) resolve();
          else setTimeout(check, 50);
        };
        check();
      });
    }

    const slice = file.slice(offset, offset + CHUNK_SIZE);
    dc.send(await slice.arrayBuffer());
    offset += CHUNK_SIZE;
    chunkIndex++;
    onProgress(Math.min(100, Math.round((chunkIndex / chunks) * 100)));
  }

  const done: ChannelMessage = { type: 'file-end', fileId };
  dc.send(JSON.stringify(done));
}

export function sendText(dc: RTCDataChannel, content: string): void {
  const msg: ChannelMessage = { type: 'text', content };
  dc.send(JSON.stringify(msg));
}

/** Stateful receiver — feed it raw DataChannel message data. */
export class FileReceiver {
  private pending: Map<string, { meta: FileMeta; chunks: ArrayBuffer[]; received: number }> =
    new Map();

  onFileComplete?: (meta: FileMeta, blob: Blob) => void;
  onProgress?: (fileId: string, pct: number) => void;
  onText?: (content: string) => void;

  receive(data: string | ArrayBuffer): void {
    if (typeof data === 'string') {
      const msg = JSON.parse(data) as ChannelMessage;
      if (msg.type === 'file-start') {
        this.pending.set(msg.fileId, { meta: msg, chunks: [], received: 0 });
      } else if (msg.type === 'file-end') {
        const entry = this.pending.get(msg.fileId);
        if (!entry) return;
        const blob = new Blob(entry.chunks, { type: entry.meta.mimeType });
        this.onFileComplete?.(entry.meta, blob);
        this.pending.delete(msg.fileId);
      } else if (msg.type === 'text') {
        this.onText?.(msg.content);
      }
    } else {
      // Binary chunk — find the in-flight transfer (only one active at a time)
      for (const [fileId, entry] of this.pending) {
        entry.chunks.push(data);
        entry.received++;
        const pct = Math.min(100, Math.round((entry.received / entry.meta.totalChunks) * 100));
        this.onProgress?.(fileId, pct);
        break; // sequential — only one active transfer
      }
    }
  }
}
